import sqlite3

DB_NAME = "control_recursos.db"

def inicializar_tablas():
    conn = sqlite3.connect(DB_NAME)
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
    conn.commit()
    conn.close()

# ⚡ ESTA ES LA FUNCIÓN QUE CORREGIMOS: Quitamos @contextmanager 
# FastAPI maneja el ciclo de vida por sí solo si usas yield de forma nativa.
def get_db():
    # ⚡ AGREGAMOS EL PARÁMETRO check_same_thread=False AQUÍ:
    conn = sqlite3.connect(DB_NAME, check_same_thread=False)
    conn.row_factory = sqlite3.Row  # Esto permite acceder por nombres de columnas
    try:
        yield conn
    finally:
        conn.close()