import io


def _auth_header(client):
    login = client.post("/api/auth/login", data={"email": "admin@test.com", "password": "admin123"})
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


class TestPropiedades:
    def test_listar(self, client, seed_data):
        res = client.get("/api/propiedades")
        assert res.status_code == 200
        assert len(res.json()) >= 1

    def test_crear(self, client, seed_data):
        res = client.post("/api/propiedades", data={
            "id_propiedad": "CAP-100", "nombre": "Test Nueva",
            "direccion": "Calle 123", "lat_oficial": -34.6, "lon_oficial": -58.4,
        })
        assert res.status_code == 200
        assert res.json()["status"] == "success"

    def test_crear_duplicado(self, client, seed_data):
        res = client.post("/api/propiedades", data={
            "id_propiedad": "CAP-001", "nombre": "Duplicado",
        })
        assert res.status_code == 500

    def test_actualizar(self, client, seed_data):
        res = client.put("/api/propiedades/CAP-001", data={
            "nombre": "Actualizada", "direccion": "Nueva dir",
            "lat_oficial": -34.6, "lon_oficial": -58.4,
        })
        assert res.status_code == 200
        assert res.json()["status"] == "success"

    def test_actualizar_no_existe(self, client, seed_data):
        res = client.put("/api/propiedades/NO-EXISTE", data={"nombre": "Test"})
        assert res.status_code == 404

    def test_eliminar(self, client, seed_data):
        res = client.delete("/api/propiedades/CAP-001")
        assert res.status_code == 200
        res = client.get("/api/propiedades")
        assert len(res.json()) == 0

    def test_eliminar_no_existe(self, client, seed_data):
        res = client.delete("/api/propiedades/NO-EXISTE")
        assert res.status_code == 404


class TestActivos:
    def test_listar(self, client, seed_data):
        res = client.get("/api/activos")
        assert res.status_code == 200
        body = res.json()
        assert "data" in body

    def test_crear(self, client, seed_data):
        res = client.post("/api/activos", data={
            "id_propiedad": "CAP-001", "nombre": "Silla", "estado": "BUENO",
        })
        assert res.status_code == 200
        assert "id_activo" in res.json()

    def test_reportar_dano(self, client, seed_data):
        res = client.post("/api/activos", data={
            "id_propiedad": "CAP-001", "nombre": "Mesa", "estado": "BUENO",
        })
        id_activo = res.json()["id_activo"]
        res = client.post(f"/api/activos/{id_activo}/reportar")
        assert res.status_code == 200
        assert res.json()["estado"] == "REQUIERE_REPARACION"

    def test_eliminar(self, client, seed_data):
        res = client.post("/api/activos", data={
            "id_propiedad": "CAP-001", "nombre": "Silla",
        })
        id_activo = res.json()["id_activo"]
        res = client.delete(f"/api/activos/{id_activo}")
        assert res.status_code == 200


class TestConsumibles:
    def test_listar(self, client, seed_data):
        res = client.get("/api/consumibles")
        assert res.status_code == 200
        assert "data" in res.json()

    def test_crear(self, client, seed_data):
        res = client.post("/api/consumibles", data={
            "id_propiedad": "CAP-001", "nombre": "Jabon",
            "stock_actual": 10, "stock_minimo": 5,
        })
        assert res.status_code == 200

    def test_ajustar_stock(self, client, seed_data):
        res = client.post("/api/consumibles", data={
            "id_propiedad": "CAP-001", "nombre": "Jabon",
            "stock_actual": 10, "stock_minimo": 5,
        })
        id_c = res.json()["id_consumible"]
        res = client.post(f"/api/consumibles/{id_c}/ajustar", data={"cantidad": 5})
        assert res.status_code == 200
        assert res.json()["stock_actual"] == 15

    def test_ajustar_stock_negativo(self, client, seed_data):
        res = client.post("/api/consumibles", data={
            "id_propiedad": "CAP-001", "nombre": "Jabon",
            "stock_actual": 3, "stock_minimo": 5,
        })
        id_c = res.json()["id_consumible"]
        res = client.post(f"/api/consumibles/{id_c}/ajustar", data={"cantidad": -10})
        assert res.status_code == 400


class TestCatalogo:
    def test_listar(self, client, seed_data):
        res = client.get("/api/catalogo_precios")
        assert res.status_code == 200
        assert len(res.json()) >= 1

    def test_crear(self, client, seed_data):
        res = client.post("/api/catalogo_precios", data={
            "id_servicio": "NUEVO", "descripcion": "Item nuevo",
            "precio_mercado": 1000, "tipo_item": "PRODUCTO",
        })
        assert res.status_code == 200

    def test_eliminar(self, client, seed_data):
        res = client.delete("/api/catalogo_precios/PINTURA")
        assert res.status_code == 200


class TestUsuarios:
    def test_listar(self, client, seed_data):
        res = client.get("/api/usuarios")
        assert res.status_code == 200
        assert len(res.json()) >= 1

    def test_crear(self, client, seed_data):
        res = client.post("/api/usuarios", data={
            "nombre": "Test", "email": "test@test.com",
            "password": "123", "id_rol": 2,
        })
        assert res.status_code == 200

    def test_crear_email_duplicado(self, client, seed_data):
        res = client.post("/api/usuarios", data={
            "nombre": "Test", "email": "admin@test.com",
            "password": "123", "id_rol": 2,
        })
        assert res.status_code == 400


class TestDashboard:
    def test_dashboard(self, client, seed_data):
        res = client.get("/api/dashboard")
        assert res.status_code == 200
        data = res.json()
        assert "alertas_criticas" in data
        assert "requerimientos_pendientes" in data


class TestRequerimientos:
    def test_crear_y_flujo(self, client, seed_data):
        res = client.post("/api/requerimientos", data={
            "id_propiedad": "CAP-001", "descripcion": "Arreglo techo",
            "id_usuario_solicitante": 1,
        })
        assert res.status_code == 200
        id_req = res.json()["id_requerimiento"]

        res = client.put(f"/api/requerimientos/{id_req}/asignar", data={"id_usuario_asignado": 1})
        assert res.status_code == 200

        foto = io.BytesIO(b"fake-image-data")
        res = client.post(
            f"/api/requerimientos/{id_req}/completar",
            data={"monto": 3000},
            files={"foto": ("test.jpg", foto, "image/jpeg")},
        )
        assert res.status_code == 200
        assert "dictamen_final" in res.json()

    def test_rechazar(self, client, seed_data):
        res = client.post("/api/requerimientos", data={
            "id_propiedad": "CAP-001", "descripcion": "Test",
            "id_usuario_solicitante": 1,
        })
        id_req = res.json()["id_requerimiento"]
        res = client.put(f"/api/requerimientos/{id_req}/rechazar")
        assert res.status_code == 200


class TestNotificaciones:
    def test_notificaciones(self, client, seed_data):
        res = client.get("/api/notificaciones")
        assert res.status_code == 200
        assert "total" in res.json()
        assert "items" in res.json()


class TestBuscar:
    def test_buscar_sin_query(self, client, seed_data):
        res = client.get("/api/buscar")
        assert res.status_code == 200
        assert res.json() == []

    def test_buscar(self, client, seed_data):
        res = client.get("/api/buscar?q=cap")
        assert res.status_code == 200
        assert len(res.json()) >= 1


class TestPublico:
    def test_resumen(self, client, seed_data):
        res = client.get("/api/publico/resumen")
        assert res.status_code == 200
        assert "total_gastos" in res.json()

    def test_propiedades(self, client, seed_data):
        res = client.get("/api/publico/propiedades")
        assert res.status_code == 200

    def test_gastos_paginado(self, client, seed_data):
        res = client.get("/api/publico/gastos?page=1&per_page=10")
        assert res.status_code == 200
        body = res.json()
        assert "data" in body
        assert "pages" in body
