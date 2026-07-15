"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Camera,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  MapPin,
  X,
} from "lucide-react";
import PageHeader from "../../../components/ui/PageHeader";
import { getApiUrl } from "../../../lib/api";
import { useAuth } from "../../../lib/AuthContext";

type AuditResult = {
  alerta_gps?: string;
  alerta_financiera?: string;
  dictamen_final?: string;
  id_ticket?: string;
  lat_oficial?: number;
  lon_oficial?: number;
  lat_foto?: number;
  lon_foto?: number;
};

const MapaAuditoria = dynamic(() => import('../../../components/MapaInspeccion'), {
  ssr: false,
  loading: () => <div className="w-full h-[250px] bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-xs text-slate-400">Cargando visor cartográfico...</div>
});

type Propiedad = {
  id_propiedad: string;
  nombre: string;
};

export default function AuditoriaPage() {
  const { usuario } = useAuth();
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [formData, setFormData] = useState({
    id_propiedad: "",
    id_servicio: "",
    monto: "",
    estado_fisico: "Excelente",
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);

  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);

  const esPropiedades = usuario?.rol === "PROPIEDADES";

  useEffect(() => {
    const propUrl = esPropiedades && usuario
      ? `/api/propiedades?id_usuario=${usuario.id}`
      : "/api/propiedades";
    fetch(getApiUrl(propUrl))
      .then((r) => r.json())
      .then((data) => {
        setPropiedades(data);
        if (data.length > 0 && !formData.id_propiedad) {
          setFormData((prev) => ({ ...prev, id_propiedad: data[0].id_propiedad }));
        }
      })
      .catch(() => {});
  }, [usuario]);

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
    data.append("id_propiedad", formData.id_propiedad);
    data.append("id_servicio", formData.id_servicio);
    data.append("monto", formData.monto);
    data.append("estado_fisico", formData.estado_fisico);
    data.append("foto", file);

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
        title="Auditoría"
        description="Este modulo ya queda alineado con el resto del frontend: a la izquierda el registro de campo y a la derecha el dictamen que devuelve el backend."
      />

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
                Propiedad
              </label>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-slate-900 focus:bg-white"
                value={formData.id_propiedad}
                onChange={(e) =>
                  setFormData({ ...formData, id_propiedad: e.target.value })
                }
                required
              >
                <option value="">Seleccionar propiedad</option>
                {propiedades.map((p) => (
                  <option key={p.id_propiedad} value={p.id_propiedad}>
                    {p.nombre || p.id_propiedad}
                  </option>
                ))}
              </select>
            </div>

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
            </div>

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
            </div>

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
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="mx-auto max-h-48 rounded-xl object-contain" />
              ) : (
                <Camera className="mx-auto h-9 w-9 text-slate-400" />
              )}
              <span className="mt-2 block text-sm font-medium text-slate-600">
                {file ? file.name : "Tomar foto desde la camara"}
              </span>
              {file && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-200"
                >
                  <X className="h-3 w-3" /> Quitar foto
                </button>
              )}
              <span className="mt-1 block text-xs text-slate-400">
                La foto se captura directamente preservando los metadatos GPS del dispositivo
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
                <MapaAuditoria
                  latOficial={result.lat_oficial}
                  lonOficial={result.lon_oficial}
                  latCaptura={result.lat_foto}
                  lonCaptura={result.lon_foto}
                  nombreCapilla={formData.id_propiedad || "Capilla Evaluada"}
                />

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

                {result.dictamen_final ? (
                  <div className={`rounded-[24px] border p-4 ${
                    result.dictamen_final === "APROBADO"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                      : "border-rose-200 bg-rose-50 text-rose-950"
                  }`}>
                    <div className="flex items-start gap-3">
                      {result.dictamen_final === "APROBADO" ? (
                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                      )}
                      <div>
                        <h4 className="text-sm font-semibold">Dictamen final</h4>
                        <p className="mt-1 text-sm">{result.dictamen_final}</p>
                      </div>
                    </div>
                  </div>
                ) : null}

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
