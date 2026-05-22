'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({ total_activos: 0, alertas_criticas: 0, recientes: [] });

  useEffect(() => {
  fetch('http://127.0.0.1:8000/api/dashboard')
    .then(res => {
      if (!res.ok) throw new Error("Error en la respuesta");
      return res.json();
    })
    .then(data => setMetrics(data))
    .catch(err => {
      console.warn("No se pudo conectar con el backend. Usando datos vacíos temporales:", err.message);
      setMetrics({ total_activos: 0, alertas_criticas: 0, recientes: [] });
    });
}, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tablero de Control</h1>
        <p className="text-sm text-slate-500">Vista consolidada para Jefes y Directores</p>
      </header>

      {/* Tarjetas de Indicadores */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase">Activos Auditados</p>
          <p className="text-2xl font-bold mt-1">{metrics.total_activos}</p>
        </div>
        <div className={`p-4 rounded-xl border shadow-sm ${metrics.alertas_criticas > 0 ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
          <p className="text-xs text-slate-500 font-medium uppercase">Alertas Críticas</p>
          <p className={`text-2xl font-bold mt-1 ${metrics.alertas_criticas > 0 ? 'text-red-600' : ''}`}>{metrics.alertas_criticas}</p>
        </div>
      </div>

      {/* Alertas de Notificación para Administradores */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ShieldAlert className="text-red-500" /> Alertas Recientes para Resolución
        </h2>
        <div className="space-y-3">
          {metrics.recientes.filter((g: any) => g.alerta_gps !== 'VALIDADO').map((g: any) => (
            <div key={g.id_ticket} className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
              <AlertTriangle className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-red-900">Falla de Ubicación Detectada</h4>
                <p className="text-xs text-red-700">Ticket #{g.id_ticket} - Propiedad: {g.id_propiedad}</p>
                <p className="text-xs text-slate-500 mt-1">Gasto: ${g.monto_pagado} | Estado GPS: {g.alerta_gps}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}