from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .database import inicializar_tablas, get_db
from .utils import extraer_gps
from datetime import datetime
import os
import shutil

app = FastAPI(title="AssetSteward API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    inicializar_tablas()

@app.post("/api/inspecciones")
async def crear_inspeccion(
    id_propiedad: str = Form(...),
    id_servicio: str = Form(...),
    monto: float = Form(...),
    estado_fisico: str = Form(...),
    foto: UploadFile = File(...),
    db=Depends(get_db)
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
    os.remove(temp_path) # Limpieza
    
    if not coordenadas_foto:
        alerta_gps = "ERROR: Sin metadatos GPS"
    elif res_gps:
        dist_lat = abs(coordenadas_foto[0] - res_gps["lat_oficial"])
        dist_lon = abs(coordenadas_foto[1] - res_gps["lon_oficial"])
        if dist_lat > 0.001 or dist_lon > 0.001:  # Margen aprox 100m
            alerta_gps = "DIVERGENCIA DE UBICACIÓN"

    # 3. Registro e inserción
    fecha = datetime.now().strftime("%Y-%m-%d %H:%M")
    cursor.execute('''INSERT INTO gastos (id_propiedad, id_servicio, monto_pagado, fecha, alerta_financiera, alerta_gps, estado_fisico)
                      VALUES (?, ?, ?, ?, ?, ?, ?)''', 
                   (id_propiedad, id_servicio, monto, fecha, alerta_fin, alerta_gps, estado_fisico))
    db.commit()
    
    return {"status": "success", "alerta_financiera": alerta_fin, "alerta_gps": alerta_gps}

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
            print(f"Aviso en conteo de alertas: {e_alertas}")
            alertas = 0
        
        # 3. Historial reciente
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
        # Esto imprimirá el error real con detalles en tu terminal de Uvicorn
        print(f"❌ ERROR CRÍTICO EN DASHBOARD: {str(e)}")
        return {"total_activos": 0, "alertas_criticas": 0, "recientes": []}

@app.get("/api/consumibles")
async def listar_consumibles(db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM catalogo_precios")
    return [dict(row) for row in cursor.fetchall()]