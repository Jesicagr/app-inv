"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const iconPropiedad = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type PropMapa = {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  address?: string;
  total_activos: number;
  estados_activos: Record<string, number>;
  total_consumibles: number;
};

function FitBounds({ items }: { items: PropMapa[] }) {
  const map = useMap();
  useEffect(() => {
    if (items.length === 0) return;
    if (items.length === 1) {
      map.setView([items[0].coordinates.lat, items[0].coordinates.lng], 13);
      return;
    }
    const bounds = L.latLngBounds(items.map((i) => [i.coordinates.lat, i.coordinates.lng]));
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [items, map]);
  return null;
}

export default function MapaPublico({
  propiedades,
  onSelect,
}: {
  propiedades: PropMapa[];
  onSelect: (p: PropMapa) => void;
}) {
  const centro: [number, number] = propiedades.length > 0
    ? [propiedades[0].coordinates.lat, propiedades[0].coordinates.lng]
    : [-34.6037, -58.3816];

  return (
    <MapContainer center={centro} zoom={13} style={{ height: "400px", width: "100%" }} preferCanvas>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds items={propiedades} />
      {propiedades.map((p) => (
        <Marker key={p.id} position={[p.coordinates.lat, p.coordinates.lng]} icon={iconPropiedad}>
          <Popup>
            <div className="font-sans text-sm min-w-[180px]">
              <h3 className="font-bold text-slate-900">{p.name}</h3>
              {p.address && <p className="text-xs text-slate-500 mt-0.5">{p.address}</p>}
              <div className="mt-2 space-y-1">
                <p className="text-xs text-slate-600">
                  <span className="font-semibold">{p.total_activos}</span> activos fijos
                </p>
                <p className="text-xs text-slate-600">
                  <span className="font-semibold">{p.total_consumibles}</span> consumibles
                </p>
              </div>
              <button
                onClick={() => onSelect(p)}
                className="mt-3 w-full rounded-full bg-slate-900 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Ver detalle
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
