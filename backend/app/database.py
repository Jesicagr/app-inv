import sqlite3

DB_NAME = "control_recursos.db"

def inicializar_tablas():
    conn = sqlite3.connect(DB_NAME, check_same_thread=False)
    cursor = conn.cursor()
    
    # 1. Tabla de Propiedades
    cursor.execute('''CREATE TABLE IF NOT EXISTS propiedades (
        id_propiedad TEXT PRIMARY KEY,
        nombre TEXT,
        lat_oficial REAL,
        lon_oficial REAL
    )''')
    
    # 2. Tabla de Catálogo de Precios
    cursor.execute('''CREATE TABLE IF NOT EXISTS catalogo_precios (
        id_servicio TEXT PRIMARY KEY,
        nombre_producto TEXT,
        precio_mercado REAL,
        stock_actual INTEGER,
        stock_minimo INTEGER
    )''')
    
    # 3. Tabla de Gastos
    cursor.execute('''CREATE TABLE IF NOT EXISTS gastos (
        id_ticket INTEGER PRIMARY KEY AUTOINCREMENT,
        id_propiedad TEXT,
        id_servicio TEXT,
        monto_pagado REAL,
        fecha TEXT,
        alerta_financiera TEXT,
        alerta_gps TEXT,
        estado_fisico TEXT,
        FOREIGN KEY(id_propiedad) REFERENCES propiedades(id_propiedad)
    )''')
    
   # ... (Dentro de tu función inicializar_tablas) ...
    
    # ⚡ Semilla con las coordenadas reales de las principales capillas de la zona
    cursor.execute("SELECT COUNT(*) FROM propiedades")
    if cursor.fetchone()[0] == 0:
        capillas_iniciales = [
            # Sede Central e Iglesia en Santa Fe Centro
            ("CAP-SF01", "Sede Central - Santa Fe Centro", -31.6524, -60.7072),
            # Capilla en la zona Norte de Santa Fe
            ("CAP-SF02", "Sede Santa Fe - Capilla Norte", -31.6110, -60.6995),
            # Capilla Principal de Santo Tomé (cerca de la plaza/avenida principal)
            ("CAP-ST01", "Capilla Sede Santo Tomé", -31.6685, -60.7533),
            # Anexo Sur de Santo Tomé
            ("CAP-ST02", "Anexo Santo Tomé - Distrito Sur", -31.6912, -60.7610)
        ]
        cursor.executemany("INSERT INTO propiedades (id_propiedad, nombre, lat_oficial, lon_oficial) VALUES (?, ?, ?, ?)", capillas_iniciales)
    
    conn.commit()
    conn.close()
    
# ⚡ CONTROL DE SEGURIDAD: Asegúrate de que esta función esté exactamente así
def get_db():
    conn = sqlite3.connect(DB_NAME, check_same_thread=False)
    conn.row_factory = sqlite3.Row  # Esto es vital para mapear las filas como diccionarios
    try:
        yield conn
    finally:
        conn.close()