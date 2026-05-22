from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .database import inicializar_tablas, get_db
from .utils import extraer_gps
from datetime import datetime
from contextlib import asynccontextmanager
import os
import shutil

# Configuración del ciclo de vida moderno (Lifespan)
@asynccontextmanager
async def lifespan(app: FastAPI):
    inicializar_tablas()
    yield

app = FastAPI(title="AssetSteward API", lifespan=lifespan)

# Middleware de CORS para permitir conexiones desde el Frontend (Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------------------======
# ⚡ ENDPOINT 1: Listar Propiedades (Capillas de Santa Fe y Santo Tomé)
# ----------------------------------------------------------------======
@app.get("/api/propiedades")
async def listar_propiedades(db = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM propiedades")
    filas = cursor.fetchall()
    return [dict(row) for row in filas]

# ----------------------------------------------------------------======
# ⚡ ENDPOINT 2: Registrar Inspección y Georreferenciación (POST unificado)
# ----------------------------------------------------------------======
@app.post("/api/inspecciones")
async def registrar_inspeccion(
    id_propiedad: str = Form(...),
    nombre_propiedad: str = Form(...), 
    id_servicio: str = Form(...),
    monto: float = Form(...),
    estado_fisico: str = Form(...),
    foto: UploadFile = File(...),
    db = Depends(get_db)
):
    # Guardar archivo de forma temporal para procesar EXIF
    temp_path = f"temp_{foto.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(foto.file, buffer)
        
    cursor = db.cursor()
    
    # 1. Auditoría Financiera
    cursor.execute("SELECT precio_mercado FROM catalogo_precios WHERE id_servicio=?", (id_servicio,))
    res_precio = cursor.fetchone()
    alerta_fin = "OK"
    if res_precio and monto > (res_precio["precio_mercado"] * 1.15):
        alerta_fin = f"SOBRECOSTO (+{round(((monto/res_precio['precio_mercado'])-1)*100, 1)}%)"

    # 2. Geofencing (Auditoría Geográfica)
    cursor.execute("SELECT lat_oficial, lon_oficial FROM propiedades WHERE id_propiedad=?", (id_propiedad,))
    res_gps = cursor.fetchone()
    alerta_gps = "VALIDADO"
    
    coordenadas_foto = extraer_gps(temp_path)
    os.remove(temp_path) # Limpieza segura de temporales
    
    # Valores por defecto de la región por si la propiedad es nueva
    lat_of = res_gps["lat_oficial"] if res_gps else -31.6524
    lon_of = res_gps["lon_oficial"] if res_gps else -60.7072
    lat_ft = coordenadas_foto[0] if coordenadas_foto else lat_of
    lon_ft = coordenadas_foto[1] if coordenadas_foto else lon_of
    distancia_calculada = 0.0

    if not coordenadas_foto:
        alerta_gps = "ERROR: Sin metadatos GPS"
    elif res_gps:
        dist_lat = abs(coordenadas_foto[0] - res_gps["lat_oficial"])
        dist_lon = abs(coordenadas_foto[1] - res_gps["lon_oficial"])
        distancia_calculada = (dist_lat**2 + dist_lon**2)**0.5 * 111000 
        
        if dist_lat > 0.001 or dist_lon > 0.001:  # Margen aprox 100m
            alerta_gps = "DIVERGENCIA DE UBICACIÓN"

    # 3. Registro e inserción en la tabla de gastos
    fecha = datetime.now().strftime("%Y-%m-%d %H:%M")
    cursor.execute('''INSERT INTO gastos (id_propiedad, id_servicio, monto_pagado, fecha, alerta_financiera, alerta_gps, estado_fisico)
                      VALUES (?, ?, ?, ?, ?, ?, ?)''', 
                   (id_propiedad, id_servicio, monto, fecha, alerta_fin, alerta_gps, estado_fisico))
    db.commit()
    
    # Retorno único y limpio
    return {
        "status": "success",
        "alerta_financiera": alerta_fin,
        "alerta_gps": alerta_gps,
        "distancia_metros": distancia_calculada,
        "lat_oficial": lat_of,
        "lon_oficial": lon_of,
        "lat_foto": lat_ft,
        "lon_foto": lon_ft,
        "nombre_propiedad": nombre_propiedad
    }

# ----------------------------------------------------------------======
# ⚡ ENDPOINT 3: Obtener Datos del Dashboard principal
# ----------------------------------------------------------------======
@app.get("/api/dashboard")
async def obtener_dashboard(db = Depends(get_db)):
    try:
        cursor = db.cursor()
        cursor.execute("SELECT COUNT(*) FROM gastos")
        res_total = cursor.fetchone()
        total_activos = res_total[0] if (res_total and res_total[0] is not None) else 0
        
        try:
            cursor.execute("SELECT COUNT(*) FROM gastos WHERE alerta_gps != 'VALIDADO' OR alerta_financiera != 'OK'")
            res_alertas = cursor.fetchone()
            alertas = res_alertas[0] if (res_alertas and res_alertas[0] is not None) else 0
        except Exception as e_alertas:
            print(f"Aviso en conteo de alertas: {e_alertas}")
            alertas = 0
        
        try:
            cursor.execute("SELECT * FROM gastos ORDER BY id_ticket DESC LIMIT 5")
            filas = cursor.fetchall()
            recientes = [dict(row) for row in filas] if filas else []
        except Exception as e_filas:
            print(f"Aviso en filas recientes: {e_filas}")
            recientes = []
        
        return {
            "total_activos": total_activos, 
            "alertas_criticas": alertas, 
            "recientes": recientes
        }
    except Exception as e:
        print(f"❌ ERROR CRÍTICO EN DASHBOARD: {str(e)}")
        return {"total_activos": 0, "alertas_criticas": 0, "recientes": []}

# ----------------------------------------------------------------======
# ⚡ ENDPOINT 4: Listar Catálogo de Consumibles
# ----------------------------------------------------------------======
@app.get("/api/consumibles")
async def listar_consumibles(db = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM catalogo_precios")
    return [dict(row) for row in cursor.fetchall()]