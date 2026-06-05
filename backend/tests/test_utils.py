from app.utils import haversine


def test_haversine_misma_ubicacion():
    dist = haversine(-34.6037, -58.3816, -34.6037, -58.3816)
    assert dist == 0


def test_haversine_aproximadamente_100km():
    # BsAs a La Plata ~ 60km
    dist = haversine(-34.6037, -58.3816, -34.9215, -57.9546)
    assert 50000 < dist < 80000


def test_haversine_dentro_tolerancia():
    dist = haversine(-34.6037, -58.3816, -34.6045, -58.3820)
    assert dist < 200


def test_haversine_fuera_tolerancia():
    dist = haversine(-34.6037, -58.3816, -34.7000, -58.5000)
    assert dist > 200


def test_haversine_hemisferios_opuestos():
    # Nueva York a Buenos Aires ~ 8500 km
    dist = haversine(40.7128, -74.0060, -34.6037, -58.3816)
    assert 8000000 < dist < 9000000
