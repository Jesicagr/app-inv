import logging
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from math import radians, sin, cos, sqrt, asin

logger = logging.getLogger("siar")
TOLERANCIA_METROS = 200

def extraer_gps_desde_stream(file_stream):
    try:
        img = Image.open(file_stream)
        exif = img.getexif()
        if not exif:
            return None

        gps_info = {}
        for tag, val in exif.items():
            decoded = TAGS.get(tag, tag)
            if decoded == "GPSInfo":
                for t in val:
                    sub_tag = GPSTAGS.get(t, t)
                    gps_info[sub_tag] = val[t]

        if not gps_info:
            gps_ifd = exif.get_ifd(0x8825)
            for t in gps_ifd:
                sub_tag = GPSTAGS.get(t, t)
                gps_info[sub_tag] = gps_ifd[t]

        def dms_to_dd(dms, ref):
            dd = float(dms[0]) + float(dms[1]) / 60 + float(dms[2]) / 3600
            return -dd if ref in ("S", "W") else dd

        lat = dms_to_dd(gps_info["GPSLatitude"], gps_info["GPSLatitudeRef"])
        lon = dms_to_dd(gps_info["GPSLongitude"], gps_info["GPSLongitudeRef"])
        return lat, lon
    except Exception as e:
        logger.error("Error procesando coordenadas EXIF: %s", e)
        return None


def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlambda = radians(lon2 - lon1)
    a = sin(dphi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(dlambda / 2) ** 2
    return R * 2 * asin(sqrt(a))
