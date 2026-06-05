'use client';

<<<<<<< HEAD
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Configuración de marcadores visuales estilizados mediante CDN seguro
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

// Componente para re-enfocar la cámara del mapa
function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.setView([lat, lon], 14); // Zoom óptimo para ver calles de Santa Fe / Santo Tomé
    }
  }, [lat, lon, map]);
  return null;
}

interface MapaAuditoriaProps {
  latOficial: number;
  lonOficial: number;
  latCaptura?: number;
  lonCaptura?: number;
  nombreCapilla: string;
}

export default function MapaInspeccion({ latOficial, lonOficial, latCaptura, lonCaptura, nombreCapilla }: MapaAuditoriaProps) {
  const [todasLasCapillas, setTodasLasCapillas] = useState<any[]>([]);
  const centroInicial = [latOficial, lonOficial] as [number, number];

  // Cargamos todas las capillas del inventario para mostrarlas en el mapa simultáneamente
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/propiedades')
      .then(res => res.json())
      .then(data => {
        // Validación de seguridad para asegurar un Arreglo limpio
        setTodasLasCapillas(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.warn("Error mapeando red de capillas:", err);
        setTodasLasCapillas([]);
      });
  }, []);

  return (
    <div className="w-full h-[260px] rounded-xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
      <MapContainer center={centroInicial} zoom={13} style={{ height: '100%', width: '100%' }}>
=======
import { useEffect, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

const iconElement = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Capilla {
  id: string;
  name: string;
  address?: string;
  coordinates: { lat: number; lng: number };
}

function MapViewport({ capillas }: { capillas: Capilla[] }) {
  const map = useMap();

  useEffect(() => {
    if (capillas.length === 0) {
      return;
    }

    if (capillas.length === 1) {
      map.flyTo(
        [capillas[0].coordinates.lat, capillas[0].coordinates.lng],
        13,
        { duration: 0.75 },
      );
      return;
    }

    const bounds = L.latLngBounds(
      capillas.map((capilla) => [capilla.coordinates.lat, capilla.coordinates.lng]),
    );

    map.fitBounds(bounds, { padding: [32, 32] });
  }, [capillas, map]);

  return null;
}

export default function MapaInspeccion({ capillas }: { capillas: Capilla[] }) {
  const validCapillas = useMemo(
    () =>
      capillas.filter(
        (capilla) =>
          Number.isFinite(capilla.coordinates.lat) &&
          Number.isFinite(capilla.coordinates.lng),
      ),
    [capillas],
  );

  const posicionCentral: [number, number] = validCapillas.length
    ? [validCapillas[0].coordinates.lat, validCapillas[0].coordinates.lng]
    : [-34.6037, -58.3816];

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-md">
      <MapContainer
        center={posicionCentral}
        zoom={13}
        preferCanvas
        style={{ height: "100%", width: "100%" }}
      >
>>>>>>> 4538650ba3315826d04261223d56a585de25cba6
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
<<<<<<< HEAD
        
        {/* ⚡ CAPA MULTIPUNTO PROTEGIDA: Dibuja las capillas oficiales en el mapa */}
        {Array.isArray(todasLasCapillas) && todasLasCapillas.map((cap: any) => (
          <Marker 
            key={cap.id_propiedad} 
            position={[cap.lat_oficial, cap.lon_oficial]} 
            icon={iconOficial}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-bold text-slate-800">{cap.nombre}</p>
                <p className="text-slate-500 font-mono mt-0.5">ID: {cap.id_propiedad}</p>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded block mt-1 text-center font-semibold">Ubicación Oficial</span>
=======
        <MapViewport capillas={validCapillas} />
        {validCapillas.map((capilla) => (
          <Marker
            key={capilla.id}
            position={[capilla.coordinates.lat, capilla.coordinates.lng]}
            icon={iconElement}
          >
            <Popup>
              <div className="font-sans">
                <h3 className="font-bold text-sm text-slate-800">
                  {capilla.name}
                </h3>
                <p className="text-xs text-slate-500 mb-1">
                  {capilla.address ?? "Punto de interes para inspeccion"}
                </p>
                {capilla.wards && capilla.wards.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs font-semibold text-slate-700 mb-1">Barrios/Unidades:</div>
                    <ul className="list-disc pl-4">
                      {capilla.wards.map((ward, idx) => (
                        <li key={idx} className="text-xs text-slate-600">{ward}</li>
                      ))}
                    </ul>
                  </div>
                )}
>>>>>>> 4538650ba3315826d04261223d56a585de25cba6
              </div>
            </Popup>
          </Marker>
        ))}

        {/* MARCADOR DE AUDITORÍA: El pin rojo que indica dónde se tomó la foto realmente */}
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

        {/* Centrado automático en la zona de conflicto o selección */}
        <RecenterMap lat={latCaptura || latOficial} lon={lonCaptura || lonOficial} />
      </MapContainer>
    </div>
  );
}
