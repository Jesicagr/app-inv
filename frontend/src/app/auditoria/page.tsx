'use client';

import { useState } from 'react';
import { Camera, MapPin, CheckCircle, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

export default function AuditoriaPage() {
  const [formData, setFormData] = useState({ id_propiedad: '', id_servicio: '', monto: '', estado_fisico: 'Excelente' });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);

    const data = new FormData();
    data.append('id_propiedad', formData.id_propiedad);
    data.append('id_servicio', formData.id_servicio);
    data.append('monto', formData.monto);
    data.append('estado_fisico', formData.estado_fisico);
    data.append('foto', file);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/inspecciones', { method: 'POST', body: data });
      const dataJson = await res.json();
      setResult(dataJson);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Auditoría y Verificación Técnica</h2>
        <p className="text-sm text-slate-500">Módulo de conciliación geográfica mediante extracción de metadatos EXIF.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        {/* Formulario Izquierdo */}
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">ID Ubicación Oficial (Capilla)</label>
            <input type="text" className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-lg text-sm" placeholder="Ej. CAP-01" onChange={e => setFormData({...formData, id_propiedad: e.target.value})} required />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">ID Gasto / Consumible</label>
            <input type="text" className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-lg text-sm" placeholder="Ej. PINTURA" onChange={e => setFormData({...formData, id_servicio: e.target.value})} required />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Monto de Factura ($)</label>
            <input type="number" className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-lg text-sm" placeholder="0.00" onChange={e => setFormData({...formData, monto: e.target.value})} required />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Estado Físico Detectado</label>
            <div className="grid grid-cols-3 gap-2">
              {['Excelente', 'Desgaste', 'Dañado'].map(est => (
                <button key={est} type="button" onClick={() => setFormData({...formData, estado_fisico: est})} className={`p-2 rounded-lg border text-xs font-semibold text-center transition-all ${formData.estado_fisico === est ? 'border-amber-500 bg-amber-50 text-amber-700 font-bold' : 'border-slate-200 bg-white'}`}>
                  {est}
                </button>
              ))}
            </div>
          </div>

          <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer">
            <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
            <Camera className="w-8 h-8 mx-auto text-slate-400 mb-1" />
            <span className="text-xs text-slate-500 font-medium block">{file ? file.name : "Tomar Foto en Campo (Dispositivo Móvil)"}</span>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white p-3 rounded-lg font-bold text-sm shadow flex items-center justify-center gap-2 hover:bg-blue-950 transition-colors">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {loading ? 'Analizando Coordenadas...' : 'Registrar e Inspeccionar'}
          </button>
        </form>

        {/* Panel Izquierdo/Derecho: Pantalla de Resultados Interactivos */}
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex flex-col justify-center items-center text-center">
          {!result && !loading && (
            <div className="text-slate-400 space-y-1">
              <MapPin className="w-12 h-12 mx-auto stroke-1" />
              <p className="text-sm font-medium">Esperando Captura de Datos</p>
              <p className="text-xs">Los metadatos e indicadores se calcularán al enviar el formulario.</p>
            </div>
          )}

          {loading && (
            <div className="space-y-2 text-blue-900 animate-pulse">
              <RefreshCw className="w-10 h-10 mx-auto animate-spin" />
              <p className="text-sm font-bold">Extrayendo Bloque EXIF Geofencing...</p>
            </div>
          )}

          {result && (
            <div className="w-full space-y-4 text-left">
              <h3 className="font-bold text-slate-900 border-b pb-2 text-sm uppercase tracking-wider text-slate-400">Resultados del Dictamen</h3>
              
              <div className={`p-3 rounded-lg flex items-start gap-3 border ${result.alerta_gps === 'VALIDADO' ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                {result.alerta_gps === 'VALIDADO' ? <CheckCircle className="w-5 h-5 shrink-0 text-green-600" /> : <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />}
                <div>
                  <h4 className="font-bold text-sm">Control Geográfico</h4>
                  <p className="text-xs mt-0.5">{result.alerta_gps}</p>
                </div>
              </div>

              <div className={`p-3 rounded-lg flex items-start gap-3 border ${result.alerta_financiera === 'OK' ? 'bg-green-50 border-green-200 text-green-900' : 'bg-amber-50 border-amber-200 text-amber-950'}`}>
                {result.alerta_financiera === 'OK' ? <CheckCircle className="w-5 h-5 shrink-0 text-green-600" /> : <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />}
                <div>
                  <h4 className="font-bold text-sm">Control Financiero</h4>
                  <p className="text-xs mt-0.5">{result.alerta_financiera}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}