import os
import logging
import math
import sqlite3
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

try:
    from .database import inicializar_tablas, get_db
    from .utils import extraer_gps_desde_stream, haversine
    from .auth import hash_password, verify_password, create_access_token, get_user_from_token
except ImportError:
    from database import inicializar_tablas, get_db
    from utils import extraer_gps_desde_stream, haversine
    from auth import hash_password, verify_password, create_access_token, get_user_from_token

from io import BytesIO

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("siar")


def paginar(page: int = 1, per_page: int = 50, max_per_page: int = 200):
    page = max(1, page)
    per_page = max(1, min(max_per_page, per_page))
    offset = (page - 1) * per_page
    return page, per_page, offset


def respuesta_paginada(data: list, total: int, page: int, per_page: int):
    return {
        "data": data,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": math.ceil(total / per_page) if total > 0 else 0,
    }


app = FastAPI(title="SIAR API")

def procesar_auditoria(cursor, id_propiedad, id_servicio, monto, foto_bytes):
    alerta_fin = "OK"
    cursor.execute("SELECT precio_mercado FROM catalogo_precios WHERE id_servicio=?", (id_servicio,))
    res_precio = cursor.fetchone()
    if res_precio and monto > (res_precio["precio_mercado"] * 1.15):
        alerta_fin = f"SOBRECOSTO (+{round(((monto/res_precio['precio_mercado'])-1)*100, 1)}%)"

    cursor.execute("SELECT lat_oficial, lon_oficial FROM propiedades WHERE id_propiedad=?", (id_propiedad,))
    res_gps = cursor.fetchone()
    alerta_gps = "VALIDADO"
    lat_foto, lon_foto = None, None

    coordenadas = extraer_gps_desde_stream(BytesIO(foto_bytes))
    if not coordenadas:
        alerta_gps = "ERROR: Sin metadatos GPS"
    elif res_gps:
        lat_foto, lon_foto = coordenadas
        distancia = haversine(lat_foto, lon_foto, res_gps["lat_oficial"], res_gps["lon_oficial"])
        if distancia > 200:
            alerta_gps = f"ALERTA: Ubicación falsa ({round(distancia)}m de diferencia)"

    if alerta_fin == "OK" and alerta_gps == "VALIDADO":
        dictamen = "APROBADO"
    elif alerta_gps == "ERROR: Sin metadatos GPS":
        dictamen = "BAJO_INVESTIGACION"
    else:
        dictamen = "RECHAZADO"

    return {
        "alerta_financiera": alerta_fin,
        "alerta_gps": alerta_gps,
        "dictamen_final": dictamen,
        "lat_foto": lat_foto,
        "lon_foto": lon_foto,
        "lat_oficial": res_gps["lat_oficial"] if res_gps else None,
        "lon_oficial": res_gps["lon_oficial"] if res_gps else None,
    }

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins.split(",") if allowed_origins != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    import sqlite3
    inicializar_tablas()
    conn = sqlite3.connect("control_recursos.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    roles = ["ADMIN", "PROPIEDADES", "AUDITOR", "LIDER"]
    for rol in roles:
        cursor.execute("INSERT OR IGNORE INTO roles (nombre_rol) VALUES (?)", (rol,))
    
    cursor.execute("SELECT id_rol FROM roles WHERE nombre_rol='ADMIN'")
    admin_rol = cursor.fetchone()
    if admin_rol:
        cursor.execute("SELECT id_usuario FROM usuarios WHERE email='admin@siar.com'")
        if not cursor.fetchone():
            hashed = hash_password("admin123")
            cursor.execute(
                "INSERT INTO usuarios (nombre, email, password_hash, id_rol) VALUES (?, ?, ?, ?)",
                ("Administrador", "admin@siar.com", hashed, admin_rol["id_rol"]),
            )
    
    conn.commit()
    conn.close()

@app.post("/api/auth/register")
async def registrar_usuario(
    nombre: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    id_rol: int = Form(...),
    db=Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute("SELECT id_usuario FROM usuarios WHERE email=?", (email,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Email ya registrado")
    hashed = hash_password(password)
    cursor.execute(
        "INSERT INTO usuarios (nombre, email, password_hash, id_rol) VALUES (?, ?, ?, ?)",
        (nombre, email, hashed, id_rol),
    )
    db.commit()
    user_id = cursor.lastrowid
    token = create_access_token({"sub": str(user_id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": {"id": user_id, "nombre": nombre, "email": email},
    }

@app.post("/api/auth/login")
async def iniciar_sesion(
    email: str = Form(...),
    password: str = Form(...),
    db=Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute(
        "SELECT u.id_usuario, u.nombre, u.email, u.password_hash, r.nombre_rol FROM usuarios u JOIN roles r ON u.id_rol = r.id_rol WHERE u.email=?",
        (email,),
    )
    user = cursor.fetchone()
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales invalidas")
    token = create_access_token({"sub": str(user["id_usuario"])})
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": {
            "id": user["id_usuario"],
            "nombre": user["nombre"],
            "email": user["email"],
            "rol": user["nombre_rol"],
        },
    }

@app.get("/api/auth/me")
async def usuario_actual(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()), db=Depends(get_db)):
    user = get_user_from_token(credentials.credentials, db)
    if not user:
        raise HTTPException(status_code=401, detail="Token invalido")
    return user

@app.post("/api/inspecciones")
async def crear_inspeccion(
    id_propiedad: str = Form(...),
    id_servicio: str = Form(...),
    monto: float = Form(...),
    estado_fisico: str = Form(default=None),
    registrado_por: int = Form(default=None),
    foto: UploadFile = File(...),
    db=Depends(get_db)
):
    foto_bytes = await foto.read()
    cursor = db.cursor()
    result = procesar_auditoria(cursor, id_propiedad, id_servicio, monto, foto_bytes)

    fecha = datetime.now().strftime("%Y-%m-%d %H:%M")
    cursor.execute('''INSERT INTO gastos
        (id_propiedad, id_servicio, monto_pagado, registrado_por, fecha_registro,
         url_evidencia_foto, lat_foto, lon_foto, alerta_financiera, alerta_gps, dictamen_final)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (id_propiedad, id_servicio, monto, registrado_por, fecha,
         foto.filename, result["lat_foto"], result["lon_foto"],
         result["alerta_financiera"], result["alerta_gps"], result["dictamen_final"]))
    id_ticket = cursor.lastrowid
    db.commit()

    return {"status": "success", "id_ticket": id_ticket, **result}

@app.get("/api/dashboard")
async def obtener_dashboard(db=Depends(get_db)):
    try:
        cursor = db.cursor()
        
        # 1. Conteo de gastos usando índices puros de tupla (más rápido y seguro)
        cursor.execute("SELECT COUNT(*) FROM gastos")
        res_total = cursor.fetchone()
        total_activos = res_total[0] if (res_total and res_total[0] is not None) else 0
        
        # 2. Conteo de alertas
        try:
            cursor.execute("SELECT COUNT(*) FROM gastos WHERE alerta_gps != 'VALIDADO' OR alerta_financiera != 'OK'")
            res_alertas = cursor.fetchone()
            alertas = res_alertas[0] if (res_alertas and res_alertas[0] is not None) else 0
        except Exception as e_alertas:
            logger.warning("Conteo de alertas: %s", e_alertas)
            alertas = 0
        
        # 3. Requerimientos pendientes
        try:
            cursor.execute("SELECT COUNT(*) FROM requerimientos WHERE estado='PENDIENTE'")
            pendientes = cursor.fetchone()[0] or 0
        except Exception:
            pendientes = 0
        
        # 4. Historial reciente
        try:
            cursor.execute("""
                SELECT g.*, p.nombre as nombre_propiedad
                FROM gastos g
                LEFT JOIN propiedades p ON g.id_propiedad = p.id_propiedad
                ORDER BY g.id_ticket DESC LIMIT 5
            """)
            filas = cursor.fetchall()
            recientes = [dict(row) for row in filas] if filas else []
        except Exception as e_filas:
            logger.warning("Filas recientes: %s", e_filas)
            recientes = []
        
        return {
            "total_activos": total_activos, 
            "alertas_criticas": alertas, 
            "recientes": recientes,
            "requerimientos_pendientes": pendientes
        }
        
    except Exception as e:
        # Esto imprimirá el error real con detalles en tu terminal de Uvicorn
        logger.error("Dashboard: %s", e)
        return {"total_activos": 0, "alertas_criticas": 0, "recientes": []}

@app.get("/api/consumibles")
async def listar_consumibles(
    id_propiedad: str = None,
    id_usuario: int = None,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=200),
    db=Depends(get_db)
):
    cursor = db.cursor()
    page, per_page, offset = paginar(page, per_page)

    if id_usuario:
        count_sql = """
            SELECT COUNT(*) FROM consumibles c
            JOIN asignacion_propiedades ap ON c.id_propiedad = ap.id_propiedad
            WHERE ap.id_usuario = ?
        """
        data_sql = """
            SELECT c.*, p.nombre as nombre_propiedad
            FROM consumibles c
            LEFT JOIN propiedades p ON c.id_propiedad = p.id_propiedad
            JOIN asignacion_propiedades ap ON c.id_propiedad = ap.id_propiedad
            WHERE ap.id_usuario = ?
            ORDER BY c.nombre LIMIT ? OFFSET ?
        """
        params_count = (id_usuario,)
        params_data = (id_usuario, per_page, offset)
    elif id_propiedad:
        count_sql = "SELECT COUNT(*) FROM consumibles WHERE id_propiedad=?"
        data_sql = """
            SELECT c.*, p.nombre as nombre_propiedad
            FROM consumibles c
            LEFT JOIN propiedades p ON c.id_propiedad = p.id_propiedad
            WHERE c.id_propiedad=?
            ORDER BY c.nombre LIMIT ? OFFSET ?
        """
        params_count = (id_propiedad,)
        params_data = (id_propiedad, per_page, offset)
    else:
        count_sql = "SELECT COUNT(*) FROM consumibles"
        data_sql = """
            SELECT c.*, p.nombre as nombre_propiedad
            FROM consumibles c
            LEFT JOIN propiedades p ON c.id_propiedad = p.id_propiedad
            ORDER BY c.nombre LIMIT ? OFFSET ?
        """
        params_count = ()
        params_data = (per_page, offset)

    cursor.execute(count_sql, params_count)
    total = cursor.fetchone()[0] or 0

    cursor.execute(data_sql, params_data)
    data = [dict(row) for row in cursor.fetchall()]

    return respuesta_paginada(data, total, page, per_page)

@app.post("/api/consumibles")
async def crear_consumible(
    id_propiedad: str = Form(...),
    nombre: str = Form(...),
    stock_actual: int = Form(default=0),
    stock_minimo: int = Form(default=0),
    unidad_medida: str = Form(default="unidades"),
    db=Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO consumibles (id_propiedad, nombre, stock_actual, stock_minimo, unidad_medida) VALUES (?, ?, ?, ?, ?)",
        (id_propiedad, nombre, stock_actual, stock_minimo, unidad_medida),
    )
    db.commit()
    return {"status": "success", "id_consumible": cursor.lastrowid}

@app.put("/api/consumibles/{id_consumible}")
async def actualizar_consumible(
    id_consumible: int,
    nombre: str = Form(...),
    stock_actual: int = Form(...),
    stock_minimo: int = Form(...),
    unidad_medida: str = Form(default="unidades"),
    db=Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute(
        "UPDATE consumibles SET nombre=?, stock_actual=?, stock_minimo=?, unidad_medida=? WHERE id_consumible=?",
        (nombre, stock_actual, stock_minimo, unidad_medida, id_consumible),
    )
    db.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Consumible no encontrado")
    return {"status": "success"}

@app.delete("/api/consumibles/{id_consumible}")
async def eliminar_consumible(id_consumible: int, db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("DELETE FROM consumibles WHERE id_consumible=?", (id_consumible,))
    db.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Consumible no encontrado")
    return {"status": "success"}

@app.post("/api/consumibles/{id_consumible}/ajustar")
async def ajustar_stock(
    id_consumible: int,
    cantidad: int = Form(...),
    db=Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute("SELECT stock_actual FROM consumibles WHERE id_consumible=?", (id_consumible,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Consumible no encontrado")
    nuevo = row["stock_actual"] + cantidad
    if nuevo < 0:
        raise HTTPException(status_code=400, detail="Stock no puede ser negativo")
    cursor.execute("UPDATE consumibles SET stock_actual=? WHERE id_consumible=?", (nuevo, id_consumible))
    db.commit()
    return {"status": "success", "stock_actual": nuevo}

@app.get("/api/catalogo_precios")
async def listar_catalogo(db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM catalogo_precios ORDER BY id_servicio")
    return [dict(row) for row in cursor.fetchall()]

@app.post("/api/catalogo_precios")
async def crear_catalogo(
    id_servicio: str = Form(...),
    descripcion: str = Form(default=""),
    precio_mercado: float = Form(...),
    tipo_item: str = Form(default="PRODUCTO"),
    db=Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO catalogo_precios (id_servicio, descripcion, precio_mercado, tipo_item) VALUES (?, ?, ?, ?)",
        (id_servicio, descripcion, precio_mercado, tipo_item),
    )
    db.commit()
    return {"status": "success", "id_servicio": id_servicio}

@app.put("/api/catalogo_precios/{id_servicio}")
async def actualizar_catalogo(
    id_servicio: str,
    descripcion: str = Form(default=""),
    precio_mercado: float = Form(...),
    tipo_item: str = Form(default="PRODUCTO"),
    db=Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute(
        "UPDATE catalogo_precios SET descripcion=?, precio_mercado=?, tipo_item=? WHERE id_servicio=?",
        (descripcion, precio_mercado, tipo_item, id_servicio),
    )
    db.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return {"status": "success"}

@app.delete("/api/catalogo_precios/{id_servicio}")
async def eliminar_catalogo(id_servicio: str, db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("DELETE FROM catalogo_precios WHERE id_servicio=?", (id_servicio,))
    db.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return {"status": "success"}

@app.get("/api/activos")
async def listar_activos(
    id_propiedad: str = None,
    id_usuario: int = None,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=200),
    db=Depends(get_db)
):
    cursor = db.cursor()
    page, per_page, offset = paginar(page, per_page)

    if id_usuario:
        count_sql = """
            SELECT COUNT(*) FROM activos_fijos a
            JOIN asignacion_propiedades ap ON a.id_propiedad = ap.id_propiedad
            WHERE ap.id_usuario = ?
        """
        data_sql = """
            SELECT a.* FROM activos_fijos a
            JOIN asignacion_propiedades ap ON a.id_propiedad = ap.id_propiedad
            WHERE ap.id_usuario = ?
            ORDER BY a.id_activo DESC LIMIT ? OFFSET ?
        """
        params_count = (id_usuario,)
        params_data = (id_usuario, per_page, offset)
    elif id_propiedad:
        count_sql = "SELECT COUNT(*) FROM activos_fijos WHERE id_propiedad=?"
        data_sql = "SELECT * FROM activos_fijos WHERE id_propiedad=? ORDER BY id_activo DESC LIMIT ? OFFSET ?"
        params_count = (id_propiedad,)
        params_data = (id_propiedad, per_page, offset)
    else:
        count_sql = "SELECT COUNT(*) FROM activos_fijos"
        data_sql = "SELECT * FROM activos_fijos ORDER BY id_activo DESC LIMIT ? OFFSET ?"
        params_count = ()
        params_data = (per_page, offset)

    cursor.execute(count_sql, params_count)
    total = cursor.fetchone()[0] or 0

    cursor.execute(data_sql, params_data)
    data = [dict(row) for row in cursor.fetchall()]

    return respuesta_paginada(data, total, page, per_page)

@app.post("/api/activos")
async def crear_activo(
    id_propiedad: str = Form(...),
    nombre: str = Form(...),
    descripcion: str = Form(default=""),
    estado: str = Form(default="BUENO"),
    codigo_inventario: str = Form(default=""),
    url_foto: str = Form(default=""),
    db=Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO activos_fijos (id_propiedad, nombre, descripcion, estado, codigo_inventario, url_foto) VALUES (?, ?, ?, ?, ?, ?)",
        (id_propiedad, nombre, descripcion, estado, codigo_inventario, url_foto),
    )
    db.commit()
    id_activo = cursor.lastrowid
    return {"status": "success", "id_activo": id_activo}

@app.put("/api/activos/{id_activo}")
async def actualizar_activo(
    id_activo: int,
    nombre: str = Form(...),
    descripcion: str = Form(default=""),
    estado: str = Form(default="BUENO"),
    codigo_inventario: str = Form(default=""),
    url_foto: str = Form(default=""),
    db=Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute(
        "UPDATE activos_fijos SET nombre=?, descripcion=?, estado=?, codigo_inventario=?, url_foto=? WHERE id_activo=?",
        (nombre, descripcion, estado, codigo_inventario, url_foto, id_activo),
    )
    db.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    return {"status": "success"}

@app.post("/api/activos/{id_activo}/reportar")
async def reportar_activo(id_activo: int, db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("UPDATE activos_fijos SET estado='REQUIERE_REPARACION' WHERE id_activo=?", (id_activo,))
    db.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    return {"status": "success", "estado": "REQUIERE_REPARACION"}

@app.delete("/api/activos/{id_activo}")
async def eliminar_activo(id_activo: int, db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("DELETE FROM activos_fijos WHERE id_activo=?", (id_activo,))
    db.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    return {"status": "success"}

@app.get("/api/propiedades")
async def listar_propiedades(id_usuario: int = None, db=Depends(get_db)):
    cursor = db.cursor()
    if id_usuario:
        cursor.execute("""
            SELECT p.* FROM propiedades p
            JOIN asignacion_propiedades a ON p.id_propiedad = a.id_propiedad
            WHERE a.id_usuario = ?
            ORDER BY p.nombre
        """, (id_usuario,))
    else:
        cursor.execute("SELECT * FROM propiedades ORDER BY nombre")
    return [dict(row) for row in cursor.fetchall()]

@app.post("/api/propiedades")
async def crear_propiedad(
    id_propiedad: str = Form(...),
    nombre: str = Form(...),
    direccion: str = Form(default=""),
    lat_oficial: float = Form(default=None),
    lon_oficial: float = Form(default=None),
    db=Depends(get_db)
):
    cursor = db.cursor()
    try:
        cursor.execute(
            "INSERT INTO propiedades (id_propiedad, nombre, direccion, lat_oficial, lon_oficial) VALUES (?, ?, ?, ?, ?)",
            (id_propiedad, nombre, direccion, lat_oficial, lon_oficial),
        )
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=500, detail="Error al crear propiedad")
    db.commit()
    return {"status": "success", "id_propiedad": id_propiedad}

@app.put("/api/propiedades/{id_propiedad}")
async def actualizar_propiedad(
    id_propiedad: str,
    nombre: str = Form(...),
    direccion: str = Form(default=""),
    lat_oficial: float = Form(default=None),
    lon_oficial: float = Form(default=None),
    db=Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute(
        "UPDATE propiedades SET nombre=?, direccion=?, lat_oficial=?, lon_oficial=? WHERE id_propiedad=?",
        (nombre, direccion, lat_oficial, lon_oficial, id_propiedad),
    )
    db.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    return {"status": "success"}

@app.delete("/api/propiedades/{id_propiedad}")
async def eliminar_propiedad(id_propiedad: str, db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("DELETE FROM propiedades WHERE id_propiedad=?", (id_propiedad,))
    db.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    return {"status": "success"}

@app.get("/api/acta/{id_ticket}")
async def generar_acta(id_ticket: int, db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM gastos WHERE id_ticket=?", (id_ticket,))
    g = cursor.fetchone()
    if not g:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    cursor.execute("SELECT nombre FROM propiedades WHERE id_propiedad=?", (g["id_propiedad"],))
    prop = cursor.fetchone()
    nombre_propiedad = prop["nombre"] if prop else g["id_propiedad"]
    
    acta = f"""
    ACTA DE INSPECCIÓN DE RECURSOS - TICKET #{g['id_ticket']}
    ----------------------------------------------
    FECHA: {g['fecha_registro']}
    PROPIEDAD: {nombre_propiedad} ({g['id_propiedad']})
    SERVICIO: {g['id_servicio']}
    MONTO REPORTADO: ${g['monto_pagado']}
    
    RESULTADOS DE AUDITORÍA:
    - CONTROL FINANCIERO: {g['alerta_financiera']}
    - CONTROL GEOGRÁFICO: {g['alerta_gps']}
    
    DICTAMEN FINAL: {g['dictamen_final']}
    ----------------------------------------------
    """
    
    return Response(
        content=acta.strip(),
        media_type="text/plain; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="acta_ticket_{g["id_ticket"]}.txt"'
        },
    )


# ─── Módulo de Usuarios y Roles ───────────────────────────────────────────────

@app.get("/api/roles")
async def listar_roles(db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM roles")
    return [dict(row) for row in cursor.fetchall()]

@app.get("/api/usuarios")
async def listar_usuarios(db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""
        SELECT u.id_usuario, u.nombre, u.email, u.id_rol, r.nombre_rol
        FROM usuarios u JOIN roles r ON u.id_rol = r.id_rol
        ORDER BY u.id_usuario
    """)
    return [dict(row) for row in cursor.fetchall()]

@app.post("/api/usuarios")
async def crear_usuario(
    nombre: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    id_rol: int = Form(...),
    db=Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute("SELECT id_usuario FROM usuarios WHERE email=?", (email,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Email ya registrado")
    hashed = hash_password(password)
    cursor.execute(
        "INSERT INTO usuarios (nombre, email, password_hash, id_rol) VALUES (?, ?, ?, ?)",
        (nombre, email, hashed, id_rol),
    )
    db.commit()
    return {"status": "success", "id_usuario": cursor.lastrowid}

@app.put("/api/usuarios/{id_usuario}")
async def actualizar_usuario(
    id_usuario: int,
    nombre: str = Form(...),
    email: str = Form(...),
    password: str = Form(default=""),
    id_rol: int = Form(...),
    db=Depends(get_db)
):
    cursor = db.cursor()
    if password:
        hashed = hash_password(password)
        cursor.execute(
            "UPDATE usuarios SET nombre=?, email=?, password_hash=?, id_rol=? WHERE id_usuario=?",
            (nombre, email, hashed, id_rol, id_usuario),
        )
    else:
        cursor.execute(
            "UPDATE usuarios SET nombre=?, email=?, id_rol=? WHERE id_usuario=?",
            (nombre, email, id_rol, id_usuario),
        )
    db.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"status": "success"}

@app.delete("/api/usuarios/{id_usuario}")
async def eliminar_usuario(id_usuario: int, db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("DELETE FROM usuarios WHERE id_usuario=?", (id_usuario,))
    db.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"status": "success"}

@app.get("/api/asignaciones")
async def listar_asignaciones(id_usuario: int = None, db=Depends(get_db)):
    cursor = db.cursor()
    if id_usuario:
        cursor.execute("""
            SELECT a.id_usuario, a.id_propiedad, p.nombre as nombre_propiedad
            FROM asignacion_propiedades a
            JOIN propiedades p ON a.id_propiedad = p.id_propiedad
            WHERE a.id_usuario=?
        """, (id_usuario,))
    else:
        cursor.execute("""
            SELECT a.id_usuario, a.id_propiedad, p.nombre as nombre_propiedad
            FROM asignacion_propiedades a
            JOIN propiedades p ON a.id_propiedad = p.id_propiedad
        """)
    return [dict(row) for row in cursor.fetchall()]

@app.post("/api/asignaciones")
async def crear_asignacion(
    id_usuario: int = Form(...),
    id_propiedad: str = Form(...),
    db=Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute(
        "INSERT OR IGNORE INTO asignacion_propiedades (id_usuario, id_propiedad) VALUES (?, ?)",
        (id_usuario, id_propiedad),
    )
    db.commit()
    return {"status": "success"}


# ─── Módulo de Requerimientos (LIDER → PROPIEDADES → Auditoría) ───────────

@app.get("/api/requerimientos")
async def listar_requerimientos(
    estado: str = None,
    id_usuario: int = None,
    id_propiedad: str = None,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=200),
    db=Depends(get_db)
):
    cursor = db.cursor()
    page, per_page, offset = paginar(page, per_page)

    where = ""
    params = []
    if estado:
        where += " AND r.estado=?"
        params.append(estado)
    if id_usuario:
        where += " AND (r.id_usuario_solicitante=? OR r.id_usuario_asignado=?)"
        params.extend([id_usuario, id_usuario])
    if id_propiedad:
        where += " AND r.id_propiedad=?"
        params.append(id_propiedad)

    cursor.execute(f"SELECT COUNT(*) FROM requerimientos r WHERE 1=1{where}", params)
    total = cursor.fetchone()[0] or 0

    sql = f"""
        SELECT r.*, p.nombre as nombre_propiedad,
               us.nombre as nombre_solicitante,
               ua.nombre as nombre_asignado
        FROM requerimientos r
        LEFT JOIN propiedades p ON r.id_propiedad = p.id_propiedad
        LEFT JOIN usuarios us ON r.id_usuario_solicitante = us.id_usuario
        LEFT JOIN usuarios ua ON r.id_usuario_asignado = ua.id_usuario
        WHERE 1=1{where}
        ORDER BY r.fecha_solicitud DESC LIMIT ? OFFSET ?
    """
    cursor.execute(sql, params + [per_page, offset])
    data = [dict(row) for row in cursor.fetchall()]

    return respuesta_paginada(data, total, page, per_page)

@app.get("/api/requerimientos/{id_requerimiento}")
async def obtener_requerimiento(id_requerimiento: int, db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""
        SELECT r.*, p.nombre as nombre_propiedad,
               us.nombre as nombre_solicitante,
               ua.nombre as nombre_asignado
        FROM requerimientos r
        LEFT JOIN propiedades p ON r.id_propiedad = p.id_propiedad
        LEFT JOIN usuarios us ON r.id_usuario_solicitante = us.id_usuario
        LEFT JOIN usuarios ua ON r.id_usuario_asignado = ua.id_usuario
        WHERE r.id_requerimiento=?
    """, (id_requerimiento,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Requerimiento no encontrado")
    return dict(row)

@app.post("/api/requerimientos")
async def crear_requerimiento(
    id_propiedad: str = Form(...),
    descripcion: str = Form(...),
    tipo: str = Form(default="GENERAL"),
    id_item: int = Form(default=None),
    id_usuario_solicitante: int = Form(...),
    db=Depends(get_db)
):
    cursor = db.cursor()
    fecha = datetime.now().strftime("%Y-%m-%d %H:%M")
    cursor.execute("""
        INSERT INTO requerimientos
        (id_propiedad, id_usuario_solicitante, descripcion, tipo, id_item, estado, fecha_solicitud)
        VALUES (?, ?, ?, ?, ?, 'PENDIENTE', ?)
    """, (id_propiedad, id_usuario_solicitante, descripcion, tipo, id_item, fecha))
    db.commit()
    return {"status": "success", "id_requerimiento": cursor.lastrowid}

@app.put("/api/requerimientos/{id_requerimiento}/asignar")
async def asignar_requerimiento(
    id_requerimiento: int,
    id_usuario_asignado: int = Form(...),
    db=Depends(get_db)
):
    cursor = db.cursor()
    fecha = datetime.now().strftime("%Y-%m-%d %H:%M")
    cursor.execute("""
        UPDATE requerimientos SET estado='EN_PROCESO', id_usuario_asignado=?, fecha_asignacion=?
        WHERE id_requerimiento=?
    """, (id_usuario_asignado, fecha, id_requerimiento))
    db.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Requerimiento no encontrado")
    return {"status": "success", "estado": "EN_PROCESO"}

@app.post("/api/requerimientos/{id_requerimiento}/completar")
async def completar_requerimiento(
    id_requerimiento: int,
    monto: float = Form(...),
    foto: UploadFile = File(...),
    db=Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM requerimientos WHERE id_requerimiento=?", (id_requerimiento,))
    req = cursor.fetchone()
    if not req:
        raise HTTPException(status_code=404, detail="Requerimiento no encontrado")
    if req["estado"] != "EN_PROCESO":
        raise HTTPException(status_code=400, detail="El requerimiento debe estar EN_PROCESO para completarse")

    foto_bytes = await foto.read()
    result = procesar_auditoria(cursor, req["id_propiedad"], req["tipo"], monto, foto_bytes)

    fecha = datetime.now().strftime("%Y-%m-%d %H:%M")
    cursor.execute('''INSERT INTO gastos
        (id_propiedad, id_servicio, monto_pagado, registrado_por, fecha_registro,
         url_evidencia_foto, lat_foto, lon_foto, alerta_financiera, alerta_gps, dictamen_final)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (req["id_propiedad"], req["tipo"], monto, req["id_usuario_asignado"], fecha,
         foto.filename, result["lat_foto"], result["lon_foto"],
         result["alerta_financiera"], result["alerta_gps"], result["dictamen_final"]))
    id_gasto = cursor.lastrowid

    cursor.execute("""
        UPDATE requerimientos SET estado='COMPLETADO', monto_gastado=?, url_foto=?,
            id_gasto=?, dictamen=?, fecha_finalizacion=?
        WHERE id_requerimiento=?
    """, (monto, foto.filename, id_gasto, result["dictamen_final"], fecha, id_requerimiento))
    db.commit()

    return {"status": "success", "id_gasto": id_gasto, "id_requerimiento": id_requerimiento, **result}

@app.put("/api/requerimientos/{id_requerimiento}/rechazar")
async def rechazar_requerimiento(id_requerimiento: int, db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("UPDATE requerimientos SET estado='RECHAZADO' WHERE id_requerimiento=?", (id_requerimiento,))
    db.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Requerimiento no encontrado")
    return {"status": "success", "estado": "RECHAZADO"}


# ─── Notificaciones ─────────────────────────────────────────────────────────

@app.get("/api/notificaciones")
async def obtener_notificaciones(db=Depends(get_db)):
    cursor = db.cursor()
    items = []

    cursor.execute("SELECT COUNT(*) FROM gastos WHERE alerta_gps != 'VALIDADO' OR alerta_financiera != 'OK'")
    alertas_gastos = cursor.fetchone()[0] or 0
    if alertas_gastos > 0:
        items.append({
            "tipo": "alerta_gasto",
            "mensaje": f"{alertas_gastos} gasto(s) con alertas GPS o financieras",
            "enlace": "/auditoria",
        })

    cursor.execute("SELECT COUNT(*) FROM requerimientos WHERE estado='PENDIENTE'")
    pendientes = cursor.fetchone()[0] or 0
    if pendientes > 0:
        items.append({
            "tipo": "requerimiento",
            "mensaje": f"{pendientes} requerimiento(s) pendientes",
            "enlace": "/requerimientos",
        })

    cursor.execute("""
        SELECT COUNT(*) FROM consumibles
        WHERE stock_actual <= stock_minimo AND stock_minimo > 0
    """)
    stock_bajo = cursor.fetchone()[0] or 0
    if stock_bajo > 0:
        items.append({
            "tipo": "stock_bajo",
            "mensaje": f"{stock_bajo} consumible(s) con stock bajo",
            "enlace": "/consumibles",
        })

    cursor.execute("SELECT COUNT(*) FROM activos_fijos WHERE estado='REQUIERE_REPARACION'")
    reparar = cursor.fetchone()[0] or 0
    if reparar > 0:
        items.append({
            "tipo": "reparacion",
            "mensaje": f"{reparar} activo(s) requieren reparacion",
            "enlace": "/activos",
        })

    return {"total": len(items), "items": items}


# ─── Búsqueda global ────────────────────────────────────────────────────────

@app.get("/api/buscar")
async def buscar(q: str = "", db=Depends(get_db)):
    if not q or len(q.strip()) < 2:
        return []
    cursor = db.cursor()
    term = f"%{q}%"
    resultados = []

    cursor.execute(
        "SELECT id_propiedad as id, nombre as texto, 'propiedad' as tipo FROM propiedades WHERE nombre LIKE ? OR id_propiedad LIKE ? LIMIT 5",
        (term, term),
    )
    resultados += [dict(r) for r in cursor.fetchall()]

    cursor.execute(
        "SELECT id_activo as id, nombre as texto, 'activo' as tipo FROM activos_fijos WHERE nombre LIKE ? OR codigo_inventario LIKE ? LIMIT 5",
        (term, term),
    )
    resultados += [dict(r) for r in cursor.fetchall()]

    cursor.execute(
        "SELECT id_consumible as id, nombre as texto, 'consumible' as tipo FROM consumibles WHERE nombre LIKE ? LIMIT 5",
        (term,),
    )
    resultados += [dict(r) for r in cursor.fetchall()]

    cursor.execute(
        "SELECT id_requerimiento as id, descripcion as texto, 'requerimiento' as tipo FROM requerimientos WHERE descripcion LIKE ? LIMIT 5",
        (term,),
    )
    resultados += [dict(r) for r in cursor.fetchall()]

    return resultados


# ─── Módulo Público / Transparencia ──────────────────────────────────────────

@app.get("/api/publico/resumen")
async def publico_resumen(db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT COUNT(*) FROM gastos")
    total = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM gastos WHERE alerta_financiera='OK' AND alerta_gps='VALIDADO'")
    validados = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM gastos WHERE alerta_financiera!='OK'")
    sobrecostos = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM gastos WHERE alerta_gps!='VALIDADO' AND alerta_gps IS NOT NULL")
    alertas_gps = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM propiedades")
    total_propiedades = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM activos_fijos")
    total_activos = cursor.fetchone()[0]
    return {
        "total_gastos": total,
        "validados": validados,
        "sobrecostos": sobrecostos,
        "alertas_gps": alertas_gps,
        "total_propiedades": total_propiedades,
        "total_activos": total_activos,
    }

@app.get("/api/publico/propiedades")
async def publico_propiedades(db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""
        SELECT p.id_propiedad, p.nombre, p.direccion, p.lat_oficial, p.lon_oficial,
               COUNT(a.id_activo) as total_activos
        FROM propiedades p
        LEFT JOIN activos_fijos a ON p.id_propiedad = a.id_propiedad
        GROUP BY p.id_propiedad
        ORDER BY p.nombre
    """)
    propiedades = [dict(row) for row in cursor.fetchall()]
    for prop in propiedades:
        cursor.execute("""
            SELECT estado, COUNT(*) as cantidad FROM activos_fijos
            WHERE id_propiedad=? GROUP BY estado
        """, (prop["id_propiedad"],))
        prop["estados_activos"] = {row["estado"]: row["cantidad"] for row in cursor.fetchall()}
        cursor.execute("""
            SELECT COUNT(*) FROM consumibles WHERE id_propiedad=?
        """, (prop["id_propiedad"],))
        prop["total_consumibles"] = cursor.fetchone()[0]
    return propiedades

@app.get("/api/publico/gastos")
async def publico_gastos(
    id_propiedad: str = None,
    year: int = None,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=200),
    db=Depends(get_db)
):
    cursor = db.cursor()
    page, per_page, offset = paginar(page, per_page)

    where = ""
    params = []
    if id_propiedad:
        where += " AND g.id_propiedad=?"
        params.append(id_propiedad)
    if year:
        where += " AND strftime('%Y', g.fecha_registro)=?"
        params.append(str(year))

    cursor.execute(f"SELECT COUNT(*) FROM gastos g WHERE 1=1{where}", params)
    total = cursor.fetchone()[0] or 0

    sql = f"""
        SELECT g.id_ticket, g.id_propiedad, p.nombre as nombre_propiedad,
               g.id_servicio, g.monto_pagado, g.fecha_registro,
               g.alerta_financiera, g.alerta_gps, g.dictamen_final
        FROM gastos g
        LEFT JOIN propiedades p ON g.id_propiedad = p.id_propiedad
        WHERE 1=1{where}
        ORDER BY g.fecha_registro DESC LIMIT ? OFFSET ?
    """
    cursor.execute(sql, params + [per_page, offset])
    data = [dict(row) for row in cursor.fetchall()]

    return respuesta_paginada(data, total, page, per_page)

@app.delete("/api/asignaciones")
async def eliminar_asignacion(
    id_usuario: int = Form(...),
    id_propiedad: str = Form(...),
    db=Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute(
        "DELETE FROM asignacion_propiedades WHERE id_usuario=? AND id_propiedad=?",
        (id_usuario, id_propiedad),
    )
    db.commit()
    return {"status": "success"}