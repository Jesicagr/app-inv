def test_login_exitoso(client, seed_data):
    res = client.post("/api/auth/login", data={"email": "admin@test.com", "password": "admin123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["usuario"]["email"] == "admin@test.com"
    assert data["usuario"]["rol"] == "ADMIN"


def test_login_credenciales_invalidas(client, seed_data):
    res = client.post("/api/auth/login", data={"email": "admin@test.com", "password": "wrong"})
    assert res.status_code == 401
    assert "Credenciales" in res.json()["detail"]


def test_login_usuario_no_existe(client, seed_data):
    res = client.post("/api/auth/login", data={"email": "noexiste@test.com", "password": "123"})
    assert res.status_code == 401


def test_register_exitoso(client, seed_data):
    res = client.post("/api/auth/register", data={
        "nombre": "Nuevo", "email": "nuevo@test.com", "password": "pass123", "id_rol": 2,
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["usuario"]["nombre"] == "Nuevo"


def test_register_email_duplicado(client, seed_data):
    res = client.post("/api/auth/register", data={
        "nombre": "Otro", "email": "admin@test.com", "password": "pass123", "id_rol": 2,
    })
    assert res.status_code == 400
    assert "registrado" in res.json()["detail"]


def test_me_con_token_valido(client, seed_data):
    login = client.post("/api/auth/login", data={"email": "admin@test.com", "password": "admin123"})
    token = login.json()["access_token"]
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "admin@test.com"


def test_me_sin_token(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_me_token_invalido(client):
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid"})
    assert res.status_code == 401
