"use client";

<<<<<<< HEAD
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Camera, MapPin, CheckCircle, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
=======
import { useState } from "react";
import {
  Camera,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  MapPin,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import { getApiUrl } from "../../lib/api";

type AuditResult = {
  alerta_gps?: string;
  alerta_financiera?: string;
  id_ticket?: string;
};
>>>>>>> 4538650ba3315826d04261223d56a585de25cba6

const MapaAuditoria = dynamic(() => import('../../components/MapaInspeccion'), {
  ssr: false,
  loading: () => <div className="w-full h-[250px] bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-xs text-slate-400">Cargando visor cartográfico...</div>
});

export default function AuditoriaPage() {
<<<<<<< HEAD
  const [capillas, setCapillas] = useState<any[]>([]);
  const [formData, setFormData] = useState({ id_propiedad: '', nombre_propiedad: '', id_servicio: '', monto: '', estado_fisico: 'Excelente' });
=======
  const [formData, setFormData] = useState({
    id_propiedad: "",
    id_servicio: "",
    monto: "",
    estado_fisico: "Excelente",
  });
>>>>>>> 4538650ba3315826d04261223d56a585de25cba6
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);

  // Consultamos las capillas reales de Santa Fe y Santo Tomé al cargar
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/propiedades')
      .then(res => res.json())
      .then(data => setCapillas(Array.isArray(data) ? data : []))
      .catch(err => console.warn("Error cargando capillas:", err));
  }, []);

  const handleCapillaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const capillaSeleccionada: any = capillas.find((c: any) => c.id_propiedad === selectedId);
    
    if (capillaSeleccionada) {
      setFormData({
        ...formData,
        id_propiedad: capillaSeleccionada.id_propiedad,
        nombre_propiedad: capillaSeleccionada.nombre
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      return;
    }

    setLoading(true);

    const data = new FormData();
<<<<<<< HEAD
    data.append('id_propiedad', formData.id_propiedad);
    data.append('nombre_propiedad', formData.nombre_propiedad);
    data.append('id_servicio', formData.id_servicio);
    data.append('monto', formData.monto);
    data.append('estado_fisico', formData.estado_fisico);
    data.append('foto', file);
=======
    data.append("id_propiedad", formData.id_propiedad);
    data.append("id_servicio", formData.id_servicio);
    data.append("monto", formData.monto);
    data.append("estado_fisico", formData.estado_fisico);
    data.append("foto", file);
>>>>>>> 4538650ba3315826d04261223d56a585de25cba6

    try {
      const res = await fetch(getApiUrl("/api/inspecciones"), {
        method: "POST",
        body: data,
      });
      const dataJson = await res.json();
      setResult(dataJson);
    } catch (err) {
      console.error(err);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Inspeccion tecnica"
        title="Auditoria"
        description="Este modulo ya queda alineado con el resto del frontend: a la izquierda el registro de campo y a la derecha el dictamen que devuelve el backend."
      />

<<<<<<< HEAD
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        {/* Formulario Izquierdo */}
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Seleccionar Capilla / Institución</label>
            <select 
              className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-lg text-sm outline-none focus:border-blue-900 focus:bg-white transition-colors cursor-pointer"
              onChange={handleCapillaChange}
              required
            >
              <option value="">-- Elige una ubicación --</option>
              {capillas.map((c: any) => (
                <option key={c.id_propiedad} value={c.id_propiedad}>
                  {c.nombre} ({c.id_propiedad})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">ID Gasto / Consumible</label>
            <input type="text" className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-lg text-sm outline-none focus:border-blue-900" placeholder="Ej. PINTURA" onChange={e => setFormData({...formData, id_servicio: e.target.value})} required />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Monto de Factura ($)</label>
            <input type="number" className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-lg text-sm outline-none focus:border-blue-900" placeholder="0.00" onChange={e => setFormData({...formData, monto: e.target.value})} required />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Estado Físico Detectado</label>
            <div className="grid grid-cols-3 gap-2">
              {['Excelente', 'Desgaste', 'Dañado'].map(est => (
                <button key={est} type="button" onClick={() => setFormData({...formData, estado_fisico: est})} className={`p-2 rounded-lg border text-xs font-semibold text-center transition-all ${formData.estado_fisico === est ? 'border-amber-500 bg-amber-50 text-amber-700 font-bold' : 'border-slate-200 bg-white text-slate-700'}`}>
                  {est}
                </button>
              ))}
=======
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Captura
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">
            Registro de inspeccion
          </h3>

          <form onSubmit={handleUpload} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Id ubicacion oficial
              </label>
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-slate-900 focus:bg-white"
                placeholder="Ej. CAP-01"
                onChange={(e) =>
                  setFormData({ ...formData, id_propiedad: e.target.value })
                }
                required
              />
>>>>>>> 4538650ba3315826d04261223d56a585de25cba6
            </div>

<<<<<<< HEAD
          <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer">
            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
            <Camera className="w-8 h-8 mx-auto text-slate-400 mb-1" />
            <span className="text-xs text-slate-500 font-medium block">{file ? file.name : "Subir foto del activo (Con GPS metadata)"}</span>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#000666] text-white p-3 rounded-lg font-bold text-sm shadow flex items-center justify-center gap-2 hover:bg-opacity-90 transition-colors">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {loading ? 'Analizando Coordenadas...' : 'Registrar e Inspeccionar'}
          </button>
        </form>

        {/* Panel Derecho */}
        <div className="bg-slate-50 rounded-xl border border-slate-200/60 p-4 flex flex-col justify-center items-center">
          {!result && !loading && (
            <div className="text-slate-400 space-y-2 p-6 text-center">
              <MapPin className="w-12 h-12 mx-auto stroke-1 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Esperando Captura de Datos</p>
              <p className="text-xs text-slate-400 max-w-[250px]">Los metadatos e indicadores geográficos se calcularán al enviar el formulario.</p>
=======
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Id gasto o consumible
              </label>
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-slate-900 focus:bg-white"
                placeholder="Ej. PINTURA"
                onChange={(e) =>
                  setFormData({ ...formData, id_servicio: e.target.value })
                }
                required
              />
>>>>>>> 4538650ba3315826d04261223d56a585de25cba6
            </div>

<<<<<<< HEAD
          {loading && (
            <div className="space-y-3 text-center p-6 animate-pulse">
              <RefreshCw className="w-10 h-10 mx-auto animate-spin text-blue-900" />
              <p className="text-sm font-bold text-slate-700">Abriendo bloque EXIF...</p>
=======
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Monto de factura
              </label>
              <input
                type="number"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-slate-900 focus:bg-white"
                placeholder="0.00"
                onChange={(e) =>
                  setFormData({ ...formData, monto: e.target.value })
                }
                required
              />
>>>>>>> 4538650ba3315826d04261223d56a585de25cba6
            </div>

<<<<<<< HEAD
          {result && (
            <div className="w-full space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Dictamen Georreferenciado</h3>
                <span className="text-[11px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded">Δ Distancia: {result.distancia_metros ? `${result.distancia_metros.toFixed(1)}m` : 'N/A'}</span>
              </div>

              <MapaAuditoria 
                latOficial={result.lat_oficial} 
                lonOficial={result.lon_oficial}
                latCaptura={result.lat_foto}
                lonCaptura={result.lon_foto}
                nombreCapilla={formData.nombre_propiedad || "Capilla Evaluada"}
              />

              <div className="space-y-2">
                <div className={`p-3 rounded-lg flex items-start gap-3 border ${result.alerta_gps === 'VALIDADO' ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                  {result.alerta_gps === 'VALIDADO' ? <CheckCircle className="w-5 h-5 shrink-0 text-green-600 mt-0.5" /> : <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />}
                  <div>
                    <h4 className="font-bold text-xs">Validación GPS</h4>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      {result.alerta_gps === 'VALIDADO' ? 'Ubicación corroborada dentro de las tolerancias institucionales.' : 'Divergencia territorial detectada. La foto difiere de la ubicación asignada.'}
                    </p>
                  </div>
                </div>
=======
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Estado fisico detectado
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["Excelente", "Desgaste", "Danado"].map((state) => (
                  <button
                    key={state}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, estado_fisico: state })
                    }
                    className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition-colors ${
                      formData.estado_fisico === state
                        ? "border-amber-300 bg-amber-50 text-amber-900"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {state}
                  </button>
                ))}
>>>>>>> 4538650ba3315826d04261223d56a585de25cba6
              </div>
            </div>

            <label className="relative block cursor-pointer rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center transition-colors hover:bg-white">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="absolute inset-0 opacity-0"
                onChange={handleFileChange}
              />
              <Camera className="mx-auto h-9 w-9 text-slate-400" />
              <span className="mt-2 block text-sm font-medium text-slate-600">
                {file ? file.name : "Tomar foto en campo"}
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {loading ? "Analizando coordenadas..." : "Registrar e inspeccionar"}
            </button>
          </form>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Dictamen
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">
            Resultado de la inspeccion
          </h3>

          <div className="mt-6 flex min-h-[420px] flex-col justify-center rounded-[24px] border border-slate-200 bg-slate-50 p-6">
            {!result && !loading ? (
              <div className="text-center text-slate-400">
                <MapPin className="mx-auto h-12 w-12" />
                <p className="mt-3 text-sm font-medium text-slate-600">
                  Esperando captura de datos
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  El backend devolvera el dictamen geografico y financiero cuando envias el formulario.
                </p>
              </div>
            ) : null}

            {loading ? (
              <div className="text-center text-slate-700">
                <RefreshCw className="mx-auto h-10 w-10 animate-spin" />
                <p className="mt-3 text-sm font-semibold">
                  Extrayendo bloque EXIF y validando datos...
                </p>
              </div>
            ) : null}

            {result ? (
              <div className="space-y-4">
                <div
                  className={`rounded-[24px] border p-4 ${
                    result.alerta_gps === "VALIDADO"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                      : "border-rose-200 bg-rose-50 text-rose-950"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.alerta_gps === "VALIDADO" ? (
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                    )}
                    <div>
                      <h4 className="text-sm font-semibold">
                        Control geografico
                      </h4>
                      <p className="mt-1 text-sm">{result.alerta_gps}</p>
                    </div>
                  </div>
                </div>

                <div
                  className={`rounded-[24px] border p-4 ${
                    result.alerta_financiera === "OK"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                      : "border-amber-200 bg-amber-50 text-amber-950"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.alerta_financiera === "OK" ? (
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    )}
                    <div>
                      <h4 className="text-sm font-semibold">
                        Control financiero
                      </h4>
                      <p className="mt-1 text-sm">{result.alerta_financiera}</p>
                    </div>
                  </div>
                </div>

                {result.id_ticket ? (
                  <a
                    href={getApiUrl(`/api/acta/${result.id_ticket}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                  >
                    Descargar acta de inspeccion
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </>
  );
}
