"use client";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
// Importante para corregir los íconos rotos por defecto de Leaflet en Next.js
import L from 'leaflet';

const iconElement = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

interface Capilla {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
}

export default function MapaInspeccion({ capillas }: { capillas: Capilla[] }) {
  const posicionCentral: [number, number] = [-34.6037, -58.3816]; // Coordenadas por defecto

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-md">
      <MapContainer center={posicionCentral} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {capillas.map((capilla) => (
          <Marker 
            key={capilla.id} 
            position={[capilla.coordinates.lat, capilla.coordinates.lng]}
            icon={iconElement}
          >
            <Popup>
              <div className="font-sans">
                <h3 className="font-bold text-sm text-slate-800">{capilla.name}</h3>
                <p className="text-xs text-slate-500">Punto de interés para inspección</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}