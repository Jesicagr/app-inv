"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle,
  MapPin,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import { getApiUrl } from "../../lib/api";

const MapaInspeccionDinamic = dynamic(
  () => import("../../components/MapaInspeccion"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] items-center justify-center rounded-[28px] border border-slate-200 bg-slate-100 text-sm font-medium text-slate-400">
        Cargando mapa de relevamiento...
      </div>
    ),
  },
);

type Metrics = {
  total_activos: number;
  alertas_criticas: number;
};

type Meetinghouse = {
  id: string;
  name: string;
  address?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
};

const sampleAssets = [
  {
    id: "ALT-2023-001",
    name: "Altar principal caoba",
    location: "Sede central / Nave principal",
    status: "Validado",
    tone: "success" as const,
    date: "12 Oct 2023",
  },
  {
    id: "SND-2021-045",
    name: "Consola Yamaha TF5",
    location: "Ubicacion desconocida",
    status: "Alerta GPS",
    tone: "danger" as const,
    date: "05 Sep 2023",
  },
];

export default function ActivosFijosPage() {
  const [metrics, setMetrics] = useState<Metrics>({
    total_activos: 0,
    alertas_criticas: 0,
  });
  const [filterAuditoria, setFilterAuditoria] = useState("Todos");
  const [capillas, setCapillas] = useState<Meetinghouse[]>([]);
  const [capillasLoading, setCapillasLoading] = useState(true);
  const [capillasError, setCapillasError] = useState("");

  useEffect(() => {
    fetch(getApiUrl("/api/dashboard"))
      .then((res) => res.json())
      .then((data) => setMetrics(data))
      .catch((err) => console.warn("Error cargando metricas:", err));
  }, []);

  useEffect(() => {
    fetch("/api/meetinghouses?scope=argentina")
      .then(async (res) => {
        const payload = (await res.json().catch(() => null)) as
          | Meetinghouse[]
          | { error?: string; details?: string }
          | null;

        if (!res.ok) {
          const errorPayload = payload as { error?: string; details?: string } | null;
          throw new Error(
            errorPayload?.details ??
              errorPayload?.error ??
              `No se pudieron cargar las capillas (${res.status}).`,
          );
        }

        return payload as Meetinghouse[];
      })
      .then((data: Meetinghouse[]) => {
        setCapillas(data);
        setCapillasError("");
      })
      .catch((error) => {
        console.warn("Error cargando capillas:", error);
        setCapillas([]);
        setCapillasError(error instanceof Error ? error.message : "No pudimos obtener capillas desde maps.churchofjesuschrist.org.");
      })
      .finally(() => setCapillasLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Inventario fisico"
        title="Activos fijos"
        description="Reordenamos este modulo para que el resumen de auditoria, la galeria de activos y el mapa convivan en una misma experiencia de trabajo."
        actions={
          <select
            className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-colors hover:border-slate-300"
            value={filterAuditoria}
            onChange={(e) => setFilterAuditoria(e.target.value)}
          >
            <option value="Todos">Estado de auditoria: Todos</option>
            <option value="Validado">Validado (GPS OK)</option>
            <option value="Alerta">Alerta GPS</option>
          </select>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total auditado"
          value={metrics.total_activos.toString()}
          caption="Activos consolidados en dashboard"
          icon={CheckCircle}
          tone="success"
        />
        <StatCard
          title="Alertas GPS"
          value={metrics.alertas_criticas.toString()}
          caption="Casos con desvio geografico"
          icon={AlertTriangle}
          tone={metrics.alertas_criticas > 0 ? "danger" : "success"}
        />
        <StatCard
          title="Cobertura"
          value="82%"
          caption="Porcentaje visual de activos validados"
          icon={MapPin}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Resumen
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">
            Estado de auditoria
          </h3>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-[24px] border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-950">
                    Validado (GPS OK)
                  </p>
                  <p className="text-sm text-emerald-800">1,245 activos</p>
                </div>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                82%
              </span>
            </div>

            <div className="flex items-center justify-between rounded-[24px] border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-600 text-white">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-rose-950">
                    Alerta GPS
                  </p>
                  <p className="text-sm text-rose-800">
                    {metrics.alertas_criticas} activos en revision
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-700">
                4%
              </span>
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Galeria
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Activos destacados
              </h3>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {sampleAssets.map((asset) => (
              <article
                key={asset.id}
                className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
              >
                <div className="relative h-40 bg-gradient-to-br from-slate-200 via-slate-100 to-white">
                  <div
                    className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${
                      asset.tone === "success"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {asset.status}
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      {asset.id}
                    </p>
                    <h4 className="mt-2 text-lg font-semibold text-slate-900">
                      {asset.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 shrink-0 text-sky-600" />
                    <span className="truncate">{asset.location}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
                    <span className="inline-flex items-center gap-2 text-slate-500">
                      <Calendar className="h-4 w-4" />
                      {asset.date}
                    </span>
                    <button className="inline-flex items-center gap-2 font-semibold text-slate-900">
                      Ver detalles
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Cobertura geografica
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              Monitoreo de capillas en Argentina
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Vista nacional alimentada desde `maps.churchofjesuschrist.org`.
            </p>
          </div>
          <span className="text-sm text-slate-400">
            {capillasLoading ? "Buscando..." : `${capillas.length} capillas`}
          </span>
        </div>
        {capillasError ? (
          <div className="mb-4 rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {capillasError}
          </div>
        ) : null}
        <div className="overflow-hidden rounded-[24px] border border-slate-200">
          {capillasLoading ? (
            <div className="flex h-[500px] items-center justify-center bg-slate-100 text-sm font-medium text-slate-500">
              Cargando capillas de toda Argentina...
            </div>
          ) : (
            <MapaInspeccionDinamic capillas={capillas} />
          )}
        </div>
      </section>
    </>
  );
}
