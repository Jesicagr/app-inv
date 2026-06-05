import os
import sys
import tempfile

os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["ALLOWED_ORIGINS"] = "*"

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import sqlite3
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import inicializar_tablas


@pytest.fixture(autouse=True)
def setup_db():
    tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp.close()
    os.environ["DATABASE_URL"] = tmp.name
    # Re-initialize the module-level DB_NAME
    import app.database
    app.database.DB_NAME = tmp.name
    inicializar_tablas()
    yield tmp.name
    try:
        os.unlink(tmp.name)
    except (FileNotFoundError, PermissionError):
        pass


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def db():
    db_name = os.environ["DATABASE_URL"]
    conn = sqlite3.connect(db_name)
    conn.row_factory = sqlite3.Row
    yield conn
    conn.close()


@pytest.fixture
def seed_data(db):
    cursor = db.cursor()
    cursor.execute("INSERT INTO roles (nombre_rol) VALUES ('ADMIN'), ('PROPIEDADES'), ('AUDITOR'), ('LIDER')")
    from app.auth import hash_password
    cursor.execute(
        "INSERT INTO usuarios (nombre, email, password_hash, id_rol) VALUES (?, ?, ?, ?)",
        ("Admin", "admin@test.com", hash_password("admin123"), 1),
    )
    cursor.execute(
        "INSERT INTO propiedades (id_propiedad, nombre, direccion, lat_oficial, lon_oficial) VALUES (?, ?, ?, ?, ?)",
        ("CAP-001", "Capilla Test", "Av. Test 123", -34.6037, -58.3816),
    )
    cursor.execute(
        "INSERT INTO catalogo_precios (id_servicio, descripcion, precio_mercado, tipo_item) VALUES (?, ?, ?, ?)",
        ("PINTURA", "Pintura latex", 5000.0, "PRODUCTO"),
    )
    db.commit()
    return db
