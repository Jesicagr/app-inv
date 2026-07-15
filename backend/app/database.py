import os
import sqlite3

DB_NAME = os.getenv("DATABASE_URL", "control_recursos.db")

def inicializar_tablas():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # 1. Módulo de Infraestructura Eclesiástica
    cursor.execute('''CREATE TABLE IF NOT EXISTS propiedades (
        id_propiedad TEXT PRIMARY KEY,
        nombre TEXT,
        direccion TEXT,
        lat_oficial REAL,
        lon_oficial REAL
    )''')
    
    # 2. Módulo de Usuarios, Roles y Asignaciones
    cursor.execute('''CREATE TABLE IF NOT EXISTS roles (
        id_rol INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_rol TEXT NOT NULL
    )''')
    
    cursor.execute('''CREATE TABLE IF NOT EXISTS usuarios (
        id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        id_rol INTEGER NOT NULL,
        FOREIGN KEY(id_rol) REFERENCES roles(id_rol)
    )''')
    
    cursor.execute('''CREATE TABLE IF NOT EXISTS asignacion_propiedades (
        id_usuario INTEGER NOT NULL,
        id_propiedad TEXT NOT NULL,
        PRIMARY KEY (id_usuario, id_propiedad),
        FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario),
        FOREIGN KEY(id_propiedad) REFERENCES propiedades(id_propiedad)
    )''')
    
    # 3. Módulo de Inventario y Stock
    cursor.execute('''CREATE TABLE IF NOT EXISTS activos_fijos (
        id_activo INTEGER PRIMARY KEY AUTOINCREMENT,
        id_propiedad TEXT NOT NULL,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        estado TEXT DEFAULT 'BUENO',
        codigo_inventario TEXT,
        codigo_activo TEXT UNIQUE,
        url_foto TEXT,
        FOREIGN KEY(id_propiedad) REFERENCES propiedades(id_propiedad)
    )''')
    
    cursor.execute('''CREATE TABLE IF NOT EXISTS consumibles (
        id_consumible INTEGER PRIMARY KEY AUTOINCREMENT,
        id_propiedad TEXT NOT NULL,
        nombre TEXT NOT NULL,
        stock_actual INTEGER DEFAULT 0,
        stock_minimo INTEGER DEFAULT 0,
        unidad_medida TEXT DEFAULT 'unidades',
        codigo_consumible TEXT UNIQUE,
        FOREIGN KEY(id_propiedad) REFERENCES propiedades(id_propiedad)
    )''')
    
    # 4. Módulo de Auditoría y Control Financiero (SIAR)
    cursor.execute('''CREATE TABLE IF NOT EXISTS catalogo_precios (
        id_servicio TEXT PRIMARY KEY,
        descripcion TEXT,
        precio_mercado REAL,
        tipo_item TEXT DEFAULT 'PRODUCTO'
    )''')
    
    cursor.execute('''CREATE TABLE IF NOT EXISTS gastos (
        id_ticket INTEGER PRIMARY KEY AUTOINCREMENT,
        id_propiedad TEXT,
        id_servicio TEXT,
        monto_pagado REAL,
        registrado_por INTEGER,
        fecha_registro TEXT,
        url_evidencia_foto TEXT,
        lat_foto REAL,
        lon_foto REAL,
        alerta_financiera TEXT,
        alerta_gps TEXT,
        dictamen_final TEXT,
        FOREIGN KEY(id_propiedad) REFERENCES propiedades(id_propiedad),
        FOREIGN KEY(id_servicio) REFERENCES catalogo_precios(id_servicio),
        FOREIGN KEY(registrado_por) REFERENCES usuarios(id_usuario)
    )''')
    
    # 5. Módulo de Requerimientos (Flujo LIDER → PROPIEDADES → Auditoría)
    cursor.execute('''CREATE TABLE IF NOT EXISTS requerimientos (
        id_requerimiento INTEGER PRIMARY KEY AUTOINCREMENT,
        id_propiedad TEXT NOT NULL,
        id_usuario_solicitante INTEGER NOT NULL,
        descripcion TEXT NOT NULL,
        tipo TEXT DEFAULT 'GENERAL',
        id_item INTEGER,
        estado TEXT DEFAULT 'PENDIENTE',
        fecha_solicitud TEXT,
        fecha_asignacion TEXT,
        fecha_finalizacion TEXT,
        id_usuario_asignado INTEGER,
        monto_gastado REAL,
        id_gasto INTEGER,
        url_foto TEXT,
        dictamen TEXT,
        FOREIGN KEY(id_propiedad) REFERENCES propiedades(id_propiedad),
        FOREIGN KEY(id_usuario_solicitante) REFERENCES usuarios(id_usuario),
        FOREIGN KEY(id_usuario_asignado) REFERENCES usuarios(id_usuario),
        FOREIGN KEY(id_gasto) REFERENCES gastos(id_ticket)
    )''')
    
    # Migraciones para tablas existentes (columnas nuevas)
    migraciones = [
        ("ALTER TABLE propiedades ADD COLUMN direccion TEXT", "propiedades.direccion"),
        ("ALTER TABLE catalogo_precios ADD COLUMN descripcion TEXT", "catalogo_precios.descripcion"),
        ("ALTER TABLE catalogo_precios ADD COLUMN tipo_item TEXT DEFAULT 'PRODUCTO'", "catalogo_precios.tipo_item"),
        ("ALTER TABLE gastos ADD COLUMN registrado_por INTEGER REFERENCES usuarios(id_usuario)", "gastos.registrado_por"),
        ("ALTER TABLE gastos ADD COLUMN url_evidencia_foto TEXT", "gastos.url_evidencia_foto"),
        ("ALTER TABLE gastos ADD COLUMN lat_foto REAL", "gastos.lat_foto"),
        ("ALTER TABLE gastos ADD COLUMN lon_foto REAL", "gastos.lon_foto"),
        ("ALTER TABLE gastos ADD COLUMN dictamen_final TEXT", "gastos.dictamen_final"),
        ("ALTER TABLE gastos ADD COLUMN fecha_registro TEXT", "gastos.fecha_registro"),
        ("ALTER TABLE activos_fijos ADD COLUMN codigo_activo TEXT", "activos_fijos.codigo_activo"),
        ("ALTER TABLE consumibles ADD COLUMN codigo_consumible TEXT", "consumibles.codigo_consumible"),
    ]
    for sql, _ in migraciones:
        try:
            cursor.execute(sql)
        except sqlite3.OperationalError:
            pass
    
    conn.commit()
    conn.close()

def get_db():
    conn = sqlite3.connect(DB_NAME, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()