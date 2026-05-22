from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS

def extraer_gps(ruta_imagen):
    try:
        img = Image.open(ruta_imagen)
        # Usamos la API pública getexif() en lugar del método privado _getexif()
        exif = img.getexif()
        if not exif: 
            return None
            
        gps_info = {}
        # Buscamos directamente el mapa de GPS usando su ID oficial (0x8825)
        # o mediante los tags tradicionales si vienen incrustados
        for tag, val in exif.items():
            decoded = TAGS.get(tag, tag)
            if decoded == "GPSInfo":
                for t in val:
                    sub_tag = GPSTAGS.get(t, t)
                    gps_info[sub_tag] = val[t]
                    
        # Si el bucle anterior no encuentra el formato viejo, 
        # intentamos extraerlo del IFD de GPS directo de las versiones modernas de Pillow
        if not gps_info:
            gps_ifd = exif.get_ifd(0x8825) # 0x8825 es el tag ID estándar para GPS
            for t in gps_ifd:
                sub_tag = GPSTAGS.get(t, t)
                gps_info[sub_tag] = gps_ifd[t]

        def dms_to_dd(dms, ref):
            dd = float(dms[0]) + float(dms[1])/60 + float(dms[2])/3600
            return -dd if ref in ['S', 'W'] else dd

        lat = dms_to_dd(gps_info['GPSLatitude'], gps_info['GPSLatitudeRef'])
        lon = dms_to_dd(gps_info['GPSLongitude'], gps_info['GPSLongitudeRef'])
        return lat, lon
    except Exception as e: 
        print(f"Error procesando coordenadas EXIF: {e}")
        return None