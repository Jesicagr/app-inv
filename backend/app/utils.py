from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS

def extraer_gps(ruta_imagen):
    try:
        img = Image.open(ruta_imagen)
        exif = img._getexif()
        if not exif: return None
        gps_info = {}
        for tag, val in exif.items():
            decoded = TAGS.get(tag, tag)
            if decoded == "GPSInfo":
                for t in val:
                    sub_tag = GPSTAGS.get(t, t)
                    gps_info[sub_tag] = val[t]
            
        def dms_to_dd(dms, ref):
            dd = float(dms[0]) + float(dms[1])/60 + float(dms[2])/3600
            return -dd if ref in ['S', 'W'] else dd

        lat = dms_to_dd(gps_info['GPSLatitude'], gps_info['GPSLatitudeRef'])
        lon = dms_to_dd(gps_info['GPSLongitude'], gps_info['GPSLongitudeRef'])
        return lat, lon
    except:
        return None