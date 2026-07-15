"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, Download, MapPin, Package, Search, ShieldCheck } from "lucide-react";
import dynamic from "next/dynamic";
import { getApiUrl } from "../../../lib/api";

const MapaPublico = dynamic(() => import("../../../components/MapaPublico"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center rounded-[28px] border border-slate-200 bg-slate-100 text-sm font-medium text-slate-400">
      Cargando mapa...
    </div>
  ),
});

type Resumen = {
  total_gastos: number;
  validados: number;
  sobrecostos: number;
  alertas_gps: number;
  total_propiedades: number;
  total_activos: number;
};

type PropPublica = {
  id_propiedad: string;
  nombre: string;
  direccion: string;
  lat_oficial: number;
  lon_oficial: number;
  total_activos: number;
  estados_activos: Record<string, number>;
  total_consumibles: number;
};

type GastoPublico = {
  id_ticket: number;
  id_propiedad: string;
  nombre_propiedad: string;
  id_servicio: string;
  monto_pagado: number;
  fecha_registro: string;
  alerta_financiera: string;
  alerta_gps: string;
  dictamen_final: string;
};

export default function PublicoPage() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [propiedades, setPropiedades] = useState<PropPublica[]>([]);
  const [gastos, setGastos] = useState<GastoPublico[]>([]);
  const [selProp, setSelProp] = useState("");
  const [selYear, setSelYear] = useState("");
  const [propFocus, setPropFocus] = useState<PropPublica | null>(null);

  useEffect(() => {
    fetch(getApiUrl("/api/publico/resumen")).then((r) => r.json()).then(setResumen).catch(() => {});
    fetch(getApiUrl("/api/publico/propiedades")).then((r) => r.json()).then(setPropiedades).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selProp) params.set("id_propiedad", selProp);
    if (selYear) params.set("year", selYear);
    fetch(getApiUrl(`/api/publico/gastos?${params}`))
      .then((r) => r.json()).then((res) => setGastos(res.data || res)).catch(() => setGastos([]));
  }, [selProp, selYear]);

  const pctVal = resumen?.total_gastos ? Math.round((resumen.validados / resumen.total_gastos) * 100) : 0;
  const pctAlert = resumen?.total_gastos ? Math.round(((resumen.total_gastos - resumen.validados) / resumen.total_gastos) * 100) : 0;

  const years = useMemo(() => {
    const y = new Set<string>();
    gastos.forEach((g) => { if (g.fecha_registro) y.add(g.fecha_registro.slice(0, 4)); });
    return [...y].sort().reverse();
  }, [gastos]);

  const propiedadesMapa = useMemo(() =>
    propiedades.filter((p) => p.lat_oficial && p.lon_oficial).map((p) => ({
      id: p.id_propiedad,
      name: p.nombre || p.id_propiedad,
      coordinates: { lat: p.lat_oficial, lng: p.lon_oficial },
      address: p.direccion,
      total_activos: p.total_activos,
      estados_activos: p.estados_activos,
      total_consumibles: p.total_consumibles,
    })),
    [propiedades],
  );

  return (
    <div className="space-y-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[20px] bg-slate-900">
          <ShieldCheck className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-semibold text-slate-900">Transparencia SIAR</h1>
        <p className="mt-2 text-slate-500 max-w-xl mx-auto">
          Dashboard de integridad, mapa de activos y buscador de gastos para rendicion de cuentas.
        </p>
      </div>

      {/* Dashboard de Integridad */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Dashboard de Integridad</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Resumen de auditoria</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[24px] border border-slate-200 p-4 text-center">
            <p className="text-3xl font-bold text-slate-900">{resumen?.total_gastos ?? "—"}</p>
            <p className="mt-1 text-sm text-slate-500">Gastos auditados</p>
          </div>
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-3xl font-bold text-emerald-900">{resumen?.validados ?? "—"}</p>
            <p className="mt-1 text-sm text-emerald-700">Validados</p>
          </div>
          <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-3xl font-bold text-amber-900">{resumen?.sobrecostos ?? "—"}</p>
            <p className="mt-1 text-sm text-amber-700">Sobrecostos</p>
          </div>
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-center">
            <p className="text-3xl font-bold text-rose-900">{resumen?.alertas_gps ?? "—"}</p>
            <p className="mt-1 text-sm text-rose-700">Alertas GPS</p>
          </div>
        </div>

        {resumen && resumen.total_gastos > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-slate-600">
              {pctVal}% Validado · {pctAlert}% Con alertas
            </p>
            <div className="flex h-6 overflow-hidden rounded-full bg-slate-100">
              <div className="bg-emerald-500 transition-all" style={{ width: `${pctVal}%` }} />
              <div className="bg-amber-400 transition-all" style={{ width: `${pctAlert}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500" /> Validados</span>
              <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-500" /> Alertas</span>
            </div>
          </div>
        )}
      </section>

      {/* Mapa de Activos */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Mapa de Activos</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          {propFocus ? `${propFocus.nombre || propFocus.id_propiedad}` : "Propiedades e inventario"}
        </h2>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="overflow-hidden rounded-[24px] border border-slate-200">
            <MapaPublico propiedades={propiedadesMapa} onSelect={(p) => {
              const found = propiedades.find((x) => x.id_propiedad === p.id);
              if (found) setPropFocus(found);
            }} />
          </div>

          <div className="space-y-4">
            {propFocus ? (
              <>
                <div className="rounded-[24px] border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Direccion</p>
                  <p className="mt-1 text-sm text-slate-900">{propFocus.direccion || "Sin direccion"}</p>
                </div>
                <div className="rounded-[24px] border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Activos fijos</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{propFocus.total_activos}</p>
                  {Object.entries(propFocus.estados_activos).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(propFocus.estados_activos).map(([est, cant]) => (
                        <div key={est} className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{est.replace("_", " ")}</span>
                          <span className="font-semibold text-slate-900">{cant}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="rounded-[24px] border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Consumibles</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{propFocus.total_consumibles}</p>
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-[200px] items-center justify-center rounded-[24px] border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
                Haga clic en una propiedad del mapa para ver su inventario
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Buscador de Gastos */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Buscador Transparente</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Gastos y actas de inspeccion</h2>

        <div className="mt-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={selProp}
              onChange={(e) => setSelProp(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-slate-900"
            >
              <option value="">Todas las propiedades</option>
              {propiedades.map((p) => <option key={p.id_propiedad} value={p.id_propiedad}>{p.nombre || p.id_propiedad}</option>)}
            </select>
          </div>
          <select
            value={selYear}
            onChange={(e) => setSelYear(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
          >
            <option value="">Todos los anos</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                <th className="pb-3 pr-4">Ticket</th>
                <th className="pb-3 pr-4">Propiedad</th>
                <th className="pb-3 pr-4">Servicio</th>
                <th className="pb-3 pr-4 text-right">Monto</th>
                <th className="pb-3 pr-4">Fecha</th>
                <th className="pb-3 pr-4">Financiero</th>
                <th className="pb-3 pr-4">GPS</th>
                <th className="pb-3 pr-4">Dictamen</th>
                <th className="pb-3 text-right">Acta</th>
              </tr>
            </thead>
            <tbody>
              {gastos.length === 0 ? (
                <tr><td colSpan={9} className="py-8 text-center text-slate-400">Sin resultados</td></tr>
              ) : (
                gastos.map((g) => (
                  <tr key={g.id_ticket} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="py-3 pr-4 font-mono text-xs text-slate-500">#{g.id_ticket}</td>
                    <td className="py-3 pr-4 text-slate-900">{g.nombre_propiedad || g.id_propiedad}</td>
                    <td className="py-3 pr-4 text-slate-600">{g.id_servicio}</td>
                    <td className="py-3 pr-4 text-right font-mono font-semibold text-slate-900">${g.monto_pagado?.toFixed(2)}</td>
                    <td className="py-3 pr-4 text-slate-500">{g.fecha_registro}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        g.alerta_financiera === "OK" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>{g.alerta_financiera === "OK" ? "OK" : "Alerta"}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        g.alerta_gps === "VALIDADO" ? "bg-emerald-100 text-emerald-800" :
                        g.alerta_gps === "ERROR: Sin metadatos GPS" ? "bg-slate-100 text-slate-600" :
                        "bg-rose-100 text-rose-800"
                      }`}>{g.alerta_gps === "VALIDADO" ? "OK" : g.alerta_gps?.startsWith("ERROR") ? "Sin GPS" : "Alerta"}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        g.dictamen_final === "APROBADO" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}>{g.dictamen_final}</span>
                    </td>
                    <td className="py-3 text-right">
                      <a href={getApiUrl(`/api/acta/${g.id_ticket}`)} target="_blank"
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50">
                        <Download className="h-3.5 w-3.5" /> Acta
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
