'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Calendar, ArrowRight, MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';

// Cargamos el mapa deshabilitando SSR para evitar el error de 'window is not defined'
const MapaInspeccionDinamic = dynamic(
  () => import('../../components/MapaInspeccion'),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-[400px] bg-slate-100 animate-pulse rounded-xl flex items-center justify-center border border-slate-200">
        <span className="text-sm text-slate-400 font-medium">Cargando mapa de relevamiento...</span>
      </div>
    ) 
  }
);

export default function ActivosFijosPage() {
  const [metrics, setMetrics] = useState({ total_activos: 0, alertas_criticas: 0 });
  const [filterAuditoria, setFilterAuditoria] = useState('Todos');

  // Datos para alimentar el mapa interactivo en el cliente
  const capillasFicticias = [
    { id: '1', name: 'Capilla Central', coordinates: { lat: -34.6037, lng: -58.3816 } }
  ];

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/dashboard')
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.warn("Error cargando métricas:", err));
  }, []);

  return (
    <div className="space-y-6">
      {/* Encabezado y Filtros */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Activos Fijos Registrados</h2>
          <p className="text-sm text-slate-500">Gestión y validación GPS del inventario físico institucional.</p>
        </div>
        <div className="flex gap-3">
          <select 
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm outline-none cursor-pointer hover:border-slate-300 transition-colors"
            value={filterAuditoria}
            onChange={(e) => setFilterAuditoria(e.target.value)}
          >
            <option value="Todos">Estado de Auditoría: Todos</option>
            <option value="Validado">Validado (GPS OK)</option>
            <option value="Alerta">Alerta GPS</option>
          </select>
        </div>
      </div>

      {/* Grid Bento Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA: Resumen y Métricas (4 columnas) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-3">Resumen de Auditoría</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Validado (GPS OK)</p>
                  <p className="text-lg font-bold text-slate-900">1,245</p>
                </div>
              </div>
              <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-md">82%</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Alerta GPS</p>
                  <p className="text-lg font-bold text-slate-900">{metrics.alertas_criticas}</p>
                </div>
              </div>
              <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-md">4%</span>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Galería de Tarjetas de Activos (8 columnas) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Altar Principal */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group">
            <div className="h-44 bg-slate-100 relative">
              <div className="absolute top-3 left-3 bg-green-100/90 text-green-800 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                <span>Validado</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs text-slate-400 font-medium">ID: ALT-2023-001</p>
                <h4 className="font-bold text-slate-900">Altar Principal Caoba</h4>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg text-xs text-slate-600">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">Sede Central - Nave Principal</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="text-slate-400 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> 12 Oct 2023</span>
                <button className="text-blue-900 font-bold hover:underline flex items-center gap-0.5">
                  Ver Detalles <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Consola */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group">
            <div className="h-44 bg-slate-100 relative">
              <div className="absolute top-3 left-3 bg-red-100/90 text-red-800 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                <span>Alerta GPS</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs text-slate-400 font-medium">ID: SND-2021-045</p>
                <h4 className="font-bold text-slate-900">Consola Yamaha TF5</h4>
              </div>
              <div className="flex items-center gap-2 bg-red-50/50 border border-red-100 p-2 rounded-lg text-xs text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="truncate">Ubicación Desconocida</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="text-slate-400 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> 05 Sep 2023</span>
                <button className="text-blue-900 font-bold hover:underline flex items-center gap-0.5">
                  Ver Detalles <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN DEL MAPA: Ocupa todo el ancho abajo del Bento Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" /> Monitoreo de Capillas Relevadas
          </h3>
          <span className="text-xs text-slate-400">Coordenadas en tiempo real</span>
        </div>
        <div className="w-full h-[400px] rounded-lg overflow-hidden border border-slate-100">
          <MapaInspeccionDinamic capillas={capillasFicticias} />
        </div>
      </div>
    </div>
  );
}