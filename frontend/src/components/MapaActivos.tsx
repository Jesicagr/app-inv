"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getApiUrl } from "../lib/api";

type PropMapa = {
  id_propiedad: string;
  nombre: string;
  lat_oficial: number;
  lon_oficial: number;
  total_activos: number;
  estados_activos: Record<string, number>;
  total_consumibles: number;
};

function iconoEstado(total: number, malos: number) {
  const color = malos > 0 ? "red" : total > 0 ? "green" : "blue";
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [22, 36],
    iconAnchor: [11, 36],
    popupAnchor: [1, -34],
    shadowSize: [36, 36],
  });
}

function FitBounds({ items }: { items: PropMapa[] }) {
  const map = useMap();
  useEffect(() => {
    if (items.length === 0) return;
    if (items.length === 1) { map.setView([items[0].lat_oficial, items[0].lon_oficial], 14); return; }
    const bounds = L.latLngBounds(items.map((i) => [i.lat_oficial, i.lon_oficial]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [items, map]);
  return null;
}

export default function MapaActivos() {
  const [items, setItems] = useState<PropMapa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("siar_token");
    const headers: Record<string, string> = {};
    if (stored) headers["Authorization"] = `Bearer ${stored}`;
    fetch(getApiUrl("/api/publico/propiedades"), { headers })
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data.filter((p: PropMapa) => p.lat_oficial && p.lon_oficial) : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-48 items-center justify-center text-sm text-slate-400">Cargando mapa...</div>;
  if (items.length === 0) return <div className="flex h-48 items-center justify-center rounded-xl border border-slate-200 text-sm text-slate-400">Sin propiedades con ubicación</div>;

  const centro: [number, number] = [items[0].lat_oficial, items[0].lon_oficial];

  return (
    <div className="h-72 w-full overflow-hidden rounded-xl border border-slate-200">
      <MapContainer center={centro} zoom={12} style={{ height: "100%", width: "100%" }} preferCanvas>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds items={items} />
        {items.map((p) => {
          const malos = (p.estados_activos?.OBSOLETO || 0) + (p.estados_activos?.["REQUIERE_REPARACION"] || 0);
          return (
            <Marker key={p.id_propiedad} position={[p.lat_oficial, p.lon_oficial]} icon={iconoEstado(p.total_activos, malos)}>
              <Popup>
                <div className="font-sans text-sm min-w-[160px]">
                  <p className="font-bold text-slate-900">{p.nombre}</p>
                  <p className="text-xs text-slate-400 font-mono">{p.id_propiedad}</p>
                  <div className="mt-2 space-y-1 text-xs">
                    <p><span className="font-semibold">{p.total_activos}</span> activos</p>
                    <p><span className="font-semibold">{p.total_consumibles}</span> consumibles</p>
                    {malos > 0 && <p className="text-rose-600 font-semibold">{malos} requieren atención</p>}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
