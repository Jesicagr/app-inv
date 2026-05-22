import sqlite3
from contextlib import contextmanager

DB_NAME = "control_recursos.db"

def inicializar_tablas():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Ubicaciones oficiales (Capillas / Sedes)
    cursor.execute('''CREATE TABLE IF NOT EXISTS propiedades (
        id_propiedad TEXT PRIMARY KEY,
        nombre TEXT,
        lat_oficial REAL,
        lon_oficial REAL
    )''')
    
    # Catálogo de consumibles y precios de mercado
    cursor.execute('''CREATE TABLE IF NOT EXISTS catalogo_precios (
        id_servicio TEXT PRIMARY KEY,
        nombre_producto TEXT,
        precio_mercado REAL,
        stock_actual INTEGER,
        stock_minimo INTEGER
    )''')
    
    # Historial de Auditorías y alertas
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

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()