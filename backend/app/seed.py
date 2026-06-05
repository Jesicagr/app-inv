import sqlite3
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from database import inicializar_tablas, DB_NAME
from auth import hash_password

def seed():
    inicializar_tablas()
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # ── Roles ──
    roles = ["ADMIN", "PROPIEDADES", "AUDITOR", "LIDER"]
    for r in roles:
        cursor.execute("INSERT OR IGNORE INTO roles (nombre_rol) VALUES (?)", (r,))

    cursor.execute("SELECT id_rol FROM roles WHERE nombre_rol='ADMIN'")
    admin_rol = cursor.fetchone()[0]
    cursor.execute("SELECT id_rol FROM roles WHERE nombre_rol='PROPIEDADES'")
    prop_rol = cursor.fetchone()[0]
    cursor.execute("SELECT id_rol FROM roles WHERE nombre_rol='LIDER'")
    lider_rol = cursor.fetchone()[0]

    # ── Usuarios ──
    usuarios = [
        ("admin@siar.com", "Administrador", "admin123", admin_rol),
        ("prop@siar.com", "Carlos Propiedades", "prop123", prop_rol),
        ("lider1@siar.com", "Juan Líder", "lider123", lider_rol),
        ("lider2@siar.com", "María Líder", "lider123", lider_rol),
    ]
    for email, nombre, pw, rol in usuarios:
        cursor.execute("SELECT id_usuario FROM usuarios WHERE email=?", (email,))
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO usuarios (nombre, email, password_hash, id_rol) VALUES (?, ?, ?, ?)",
                (nombre, email, hash_password(pw), rol),
            )

    # ── Propiedades ──
    propiedades = [
        ("CAP-001", "Capilla Buenos Aires Centro", "Av. Rivadavia 1500, CABA", -34.6083, -58.3812),
        ("CAP-002", "Capilla Córdoba Norte", "Av. Colón 2500, Córdoba", -31.4135, -64.1810),
        ("CAP-003", "Capilla Rosario", "San Martín 800, Rosario", -32.9468, -60.6393),
        ("CAP-004", "Capilla Mendoza", "Av. San Martín 1200, Mendoza", -32.8895, -68.8458),
        ("CAP-005", "Capilla La Plata", "Calle 50 e/ 7 y 8, La Plata", -34.9215, -57.9546),
        ("CAP-006", "Capilla Tucumán", "Av. Mitre 400, San Miguel de Tucumán", -26.8083, -65.2176),
    ]
    for row in propiedades:
        cursor.execute("INSERT OR IGNORE INTO propiedades (id_propiedad, nombre, direccion, lat_oficial, lon_oficial) VALUES (?, ?, ?, ?, ?)", row)

    # ── Catálogo de precios ──
    catalogo = [
        ("PINTURA", "Pintura látex interior x20L", 4500, "PRODUCTO"),
        ("LAMPARA", "Lámpara LED techo 40W", 2500, "PRODUCTO"),
        ("SILLA", "Silla plástica apilable", 1800, "PRODUCTO"),
        ("MESA", "Mesa plegable rectangular", 8500, "PRODUCTO"),
        ("BOMBILLA", "Bombilla LED E27 12W", 800, "PRODUCTO"),
        ("PAPEL_HIG", "Papel higiénico x6 rollos", 350, "PRODUCTO"),
        ("JABON", "Jabón líquido x5L", 420, "PRODUCTO"),
        ("MANTENIMIENTO", "Mantenimiento general", 15000, "SERVICIO"),
        ("LIMPIEZA", "Servicio de limpieza profunda", 8000, "SERVICIO"),
        ("SEGURIDAD", "Mantenimiento sistema seguridad", 12000, "SERVICIO"),
    ]
    for row in catalogo:
        cursor.execute("INSERT OR IGNORE INTO catalogo_precios (id_servicio, descripcion, precio_mercado, tipo_item) VALUES (?, ?, ?, ?)", row)

    # ── Activos fijos ──
    activos = [
        # CAP-001: Buenos Aires Centro
        ("CAP-001", "Silla plástica", "Silla apilable color blanco", "BUENO", "SILLA-001"),
        ("CAP-001", "Mesa plegable", "Mesa rectangular 1.80m", "BUENO", "MESA-001"),
        ("CAP-001", "Proyector Epson", "Proyector multimedia", "EXCELENTE", "PROY-001"),
        ("CAP-001", "Himnario", "Himnario x20 unidades", "REQUIERE_REPARACION", "HIMN-001"),
        ("CAP-001", "Equipo de sonido", "Amplificador + parlantes", "BUENO", "SONI-001"),
        # CAP-002: Córdoba Norte
        ("CAP-002", "Silla plástica", "Silla apilable color azul", "BUENO", "SILLA-002"),
        ("CAP-002", "Mesa plegable", "Mesa rectangular 1.80m", "EXCELENTE", "MESA-002"),
        ("CAP-002", "Púlpito de madera", "", "BUENO", "PULP-001"),
        ("CAP-002", "Silla plástica", "Silla apilable color azul", "OBSOLETO", "SILLA-003"),
        # CAP-003: Rosario
        ("CAP-003", "Silla plástica", "Silla apilable color negro", "BUENO", "SILLA-004"),
        ("CAP-003", "Mesa plegable", "Mesa rectangular 1.80m", "REQUIERE_REPARACION", "MESA-003"),
        ("CAP-003", "Pizarra blanca", "Pizarra 2x1m", "BUENO", "PIZA-001"),
        # CAP-004: Mendoza
        ("CAP-004", "Silla plástica", "Silla apilable color verde", "EXCELENTE", "SILLA-005"),
        ("CAP-004", "Mesa plegable", "Mesa rectangular 1.80m", "BUENO", "MESA-004"),
        ("CAP-004", "Estufa", "Estufa a gas tiro balanceado", "BUENO", "ESTU-001"),
        # CAP-005: La Plata
        ("CAP-005", "Silla plástica", "Silla apilable color gris", "BUENO", "SILLA-006"),
        ("CAP-005", "Mesa plegable", "Mesa rectangular 1.80m", "EXCELENTE", "MESA-005"),
        # CAP-006: Tucumán
        ("CAP-006", "Silla plástica", "Silla apilable color rojo", "BUENO", "SILLA-007"),
        ("CAP-006", "Ventilador techo", "", "BUENO", "VENT-001"),
        ("CAP-006", "Extintor", "Extintor ABC 5kg", "EXCELENTE", "EXTI-001"),
    ]
    for row in activos:
        cursor.execute(
            "INSERT INTO activos_fijos (id_propiedad, nombre, descripcion, estado, codigo_inventario) VALUES (?, ?, ?, ?, ?)",
            row,
        )

    # ── Consumibles ──
    consumibles = [
        ("CAP-001", "Papel higiénico", 12, 10, "packs"),
        ("CAP-001", "Jabón líquido", 3, 5, "litros"),
        ("CAP-001", "Bombillas LED", 8, 10, "unidades"),
        ("CAP-002", "Papel higiénico", 25, 10, "packs"),
        ("CAP-002", "Jabón líquido", 6, 5, "litros"),
        ("CAP-003", "Papel higiénico", 4, 10, "packs"),
        ("CAP-003", "Jabón líquido", 2, 5, "litros"),
        ("CAP-003", "Bombillas LED", 15, 10, "unidades"),
        ("CAP-004", "Papel higiénico", 18, 10, "packs"),
        ("CAP-005", "Papel higiénico", 7, 10, "packs"),
        ("CAP-005", "Jabón líquido", 4, 5, "litros"),
        ("CAP-006", "Papel higiénico", 30, 10, "packs"),
    ]
    for row in consumibles:
        cursor.execute(
            "INSERT INTO consumibles (id_propiedad, nombre, stock_actual, stock_minimo, unidad_medida) VALUES (?, ?, ?, ?, ?)",
            row,
        )

    # ── Asignaciones (PROPIEDADES a CAP-001, CAP-002, CAP-003) ──
    cursor.execute("SELECT id_usuario FROM usuarios WHERE email='prop@siar.com'")
    prop_id = cursor.fetchone()[0]
    for pid in ["CAP-001", "CAP-002", "CAP-003"]:
        cursor.execute("INSERT OR IGNORE INTO asignacion_propiedades (id_usuario, id_propiedad) VALUES (?, ?)", (prop_id, pid))

    # ── Requerimientos de ejemplo ──
    cursor.execute("SELECT id_usuario FROM usuarios WHERE email='lider1@siar.com'")
    lider1_id = cursor.fetchone()[0]
    requerimientos = [
        ("CAP-001", lider1_id, "Faltan bombillas en el salon principal", "CONSUMIBLE", None, "PENDIENTE"),
        ("CAP-003", lider1_id, "Silla rota en el aula 2", "ACTIVO", None, "PENDIENTE"),
    ]
    for row in requerimientos:
        cursor.execute(
            "INSERT INTO requerimientos (id_propiedad, id_usuario_solicitante, descripcion, tipo, id_item, estado, fecha_solicitud) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))",
            row,
        )

    conn.commit()
    conn.close()
    print("Seed completado.")
    print("Usuarios: admin@siar.com / admin123 | prop@siar.com / prop123 | lider1@siar.com / lider123 | lider2@siar.com / lider123")
    print(f"Propiedades: CAP-001 a CAP-006 | Activos: {len(activos)} | Consumibles: {len(consumibles)} | Requerimientos: {len(requerimientos)}")

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    seed()
