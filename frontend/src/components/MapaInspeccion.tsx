"use client";

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
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
