'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getApiUrl } from '../lib/api';

const iconOficial = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const iconCaptura = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapaInspeccionProps {
  latOficial?: number;
  lonOficial?: number;
  latCaptura?: number;
  lonCaptura?: number;
  nombreCapilla?: string;
}

function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.setView([lat, lon], 14);
    }
  }, [lat, lon, map]);
  return null;
}

export default function MapaInspeccion({ latOficial, lonOficial, latCaptura, lonCaptura, nombreCapilla }: MapaInspeccionProps) {
  const [todasLasCapillas, setTodasLasCapillas] = useState<any[]>([]);

  const centroInicial: [number, number] = [latOficial ?? -34.6037, lonOficial ?? -58.3816];

  useEffect(() => {
    fetch(getApiUrl('/api/propiedades'))
      .then(res => res.json())
      .then(data => setTodasLasCapillas(Array.isArray(data) ? data : []))
      .catch(err => {
        console.warn("Error mapeando red de capillas:", err);
        setTodasLasCapillas([]);
      });
  }, []);

  return (
    <div className="w-full h-[260px] rounded-xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
      <MapContainer center={centroInicial} zoom={13} style={{ height: '100%', width: '100%' }} preferCanvas>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {Array.isArray(todasLasCapillas) && todasLasCapillas.map((cap: any) => (
          <Marker key={cap.id_propiedad} position={[cap.lat_oficial, cap.lon_oficial]} icon={iconOficial}>
            <Popup>
              <div className="text-xs">
                <p className="font-bold text-slate-800">{cap.nombre}</p>
                <p className="text-slate-500 font-mono mt-0.5">ID: {cap.id_propiedad}</p>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded block mt-1 text-center font-semibold">Ubicación Oficial</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {latCaptura && lonCaptura && (
          <Marker position={[latCaptura, lonCaptura]} icon={iconCaptura}>
            <Popup>
              <div className="text-xs">
                <span className="font-bold text-red-700">Evidencia Fotográfica</span>
                <p className="text-slate-600 mt-0.5">Captura efectuada para: <br /><span className="font-semibold">{nombreCapilla}</span></p>
              </div>
            </Popup>
          </Marker>
        )}

        <RecenterMap lat={latCaptura || latOficial!} lon={lonCaptura || lonOficial!} />
      </MapContainer>
    </div>
  );
}
