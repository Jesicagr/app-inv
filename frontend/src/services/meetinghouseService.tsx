// services/meetinghouseService.js

/**
 * Obtiene las capillas cercanas utilizando el endpoint interno interceptado.
 * @param {number} lat - Latitud del centro de búsqueda
 * @param {number} lng - Longitud del centro de búsqueda
 * @param {number} radiusKm - Radio de búsqueda en kilómetros
 */
export async function fetchNearbyMeetinghouses(lat: any, lng: any, radiusKm = 15) {
  // NOTA: Reemplaza esta URL por el endpoint exacto que captures en la pestaña Network
  const ENDPOINT = 'https://maps.churchofjesuschrist.org/api/v4/meetinghouses'; 
  
  const url = `${ENDPOINT}?lat=${lat}&lng=${lng}&radius=${radiusKm}&lang=es`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        // El User-Agent simula un navegador real para evitar bloqueos por seguridad
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.churchofjesuschrist.org/',
        'Origin': 'https://www.churchofjesuschrist.org'
      }
    });

    if (!response.ok) {
      throw new Error(`Error en la API interna: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return formatMeetinghouses(data);
  } catch (error) {
    console.error("Fallo al recuperar ubicaciones de capillas:", error);
    // Aquí puedes retornar un fallback o lanzar el error según la arquitectura de tu app
    return [];
  }
}

/**
 * Normaliza los datos de la API interna para proteger el resto de tu aplicación
 * si el formato del JSON original cambia en el futuro.
 */
function formatMeetinghouses(rawJson: { locations: any; results: any; }) {
  // Asumiendo una estructura típica basada en arreglos de ubicaciones
  const locations = rawJson.locations || rawJson.results || [];
  
  return locations.map((item: { id: any; unitId: any; name: any; propertyName: any; address: { formattedAddress: any; }; streetAddress: any; latitude: any; geo: { lat: any; lng: any; }; longitude: any; meetingTimes: any; }) => ({
    id: item.id || item.unitId,
    name: item.name || item.propertyName,
    address: item.address?.formattedAddress || item.streetAddress,
    coordinates: {
      lat: item.latitude || item.geo?.lat,
      lng: item.longitude || item.geo?.lng
    },
    schedule: item.meetingTimes || null
  }));
}