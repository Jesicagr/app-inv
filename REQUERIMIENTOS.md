# SIAR - Sistema de Integridad de Activos y Recursos

## Descripción del Sistema

SIAR es una plataforma web para la gestión, auditoría y control de activos fijos en capillas/m Meetinghouses. Permite mapear propiedades en tiempo real, auditar gastos con verificación GPS y generar códigos QR para inventario.

## Credenciales de prueba

Las credenciales de los usuarios seed se encuentran en `.env.example` (ver archivo de ejemplo en la raíz del proyecto).

## Requerimientos

### 1. Mapeo y Consulta en Tiempo Real (Foco principal)

- [x] Base de datos georreferenciada con capillas con IDs reales de Santa Fe y Santo Tomé
- [x] API Multipunto: endpoint `GET /api/propiedades`
- [x] Interfaz Desplegable: selector dinámico para propiedades
- [ ] Mapeo e Interacción Directa: vista general donde el supervisor pueda hacer clic sobre cualquier iglesia para ver su ficha técnica e historial de activos en tiempo real

### 2. Auditoría y Control de Desvíos (Geofencing y Finanzas)

- [x] Extracción EXIF Dinámica: endpoint web asíncrono para recibir archivos temporales desde el navegador
- [x] Comparación de Tolerancia: cálculo automático de deltas cartográficos (~100m)
- [x] Alerta de Sobrecosto: cruce de monto contra costo de mercado con umbral del 15%

### 3. Códigos QR para Información de Activos Fijos

- [ ] Modificación del Esquema Base de Datos: tabla `activos_fijos` (bancos, aires acondicionados, equipos de audio)
- [ ] Generador de QR dinámicos: endpoint que reciba ID de activo y genere imagen QR
- [ ] Vista de Escaneo Móvil: interfaz responsive en Next.js para escanear QR y mostrar ficha del activo

### 4. Comparación de Stock e Informes de Inspección

- [ ] Dictamen de Inspección: migrar acta .txt a reporte PDF interactivo descargable
- [ ] Conciliación y Comparación de Stock: cruzar inventario ideal vs cantidades físicas

## Resumen de funcionalidades

| # | Requerimiento | Estado |
|---|---------------|--------|
| 1 | Visor de Capillas (mapa clickeable + ficha + activos) | A medias |
| 2 | Endpoint generador de QR (`/api/activos/{id}/qr` → PNG) | Falta |
| 3 | Página de escaneo móvil (lector QR + ficha + update) | Falta |
| 4 | Reporte PDF descargable (reemplazar .txt) | Falta |
| 5 | Conciliación de stock (ideal vs real, faltantes, depreciación) | Falta |

## Próximos pasos recomendados

1. **Primero:** Crear la tabla `activos_fijos` en el backend y agregar funcionalidad para generar e imprimir códigos QR
2. **Segundo:** Crear pantalla independiente de "Visor de Capillas" para ver activos asignados a cada una en tiempo real

## Notas técnicas

- **Backend:** FastAPI + SQLite
- **Frontend:** Next.js + React + Tailwind CSS
- **Validación de Fotos:** Los AP deben tomar fotos con ubicación activada. Si envían por WhatsApp se pierden los metadatos.
- **Escalabilidad:** La lógica de base de datos puede montarse en un servidor para versión web completa.
