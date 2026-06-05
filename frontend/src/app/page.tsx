"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle,
  ClipboardCheck,
  Package,
  ShieldAlert,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { getApiUrl } from "../lib/api";

type DashboardRecord = {
  id_ticket: string;
  id_propiedad: string;
  monto_pagado: number;
  alerta_gps: string;
};

type DashboardMetrics = {
  total_activos: number;
  alertas_criticas: number;
  recientes: DashboardRecord[];
};

const initialMetrics: DashboardMetrics = {
  total_activos: 0,
  alertas_criticas: 0,
  recientes: [],
};

const quickAccess = [
  {
    href: "/consumibles",
    title: "Consumibles",
    description: "Controla stock, gasto validado y movimientos recientes.",
    icon: Package,
  },
  {
    href: "/activos",
    title: "Activos fijos",
    description: "Consulta el inventario fisico y el mapa de relevamiento.",
    icon: Boxes,
  },
  {
    href: "/auditoria",
    title: "Auditoria",
    description: "Registra inspecciones y descarga actas tecnicas.",
    icon: ClipboardCheck,
  },
];

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);

  useEffect(() => {
    fetch(getApiUrl("/api/dashboard"))
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se pudo obtener el dashboard");
        }
        return res.json();
      })
      .then((data) => setMetrics(data))
      .catch((err) => {
        console.warn("No se pudo conectar con el backend:", err.message);
        setMetrics(initialMetrics);
      });
  }, []);

  const openAlerts = metrics.recientes.filter(
    (item) => item.alerta_gps !== "VALIDADO",
  );

  return (
    <>
      <PageHeader
        eyebrow="Vista general"
        title="Tablero de control"
        description="Organizamos el frontend alrededor de modulos claros para que el seguimiento operativo sea mas simple: dashboard, consumibles, activos, auditoria y reportes."
        actions={
          <Link
            href="/reportes"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Abrir reportes
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Activos auditados"
          value={metrics.total_activos.toString()}
          caption="Registros consolidados desde el backend"
          icon={Boxes}
        />
        <StatCard
          title="Alertas criticas"
          value={metrics.alertas_criticas.toString()}
          caption="Casos que requieren revision prioritaria"
          icon={ShieldAlert}
          tone={metrics.alertas_criticas > 0 ? "danger" : "success"}
        />
        <StatCard
          title="Inspecciones recientes"
          value={metrics.recientes.length.toString()}
          caption="Tickets disponibles para seguimiento"
          icon={ClipboardCheck}
        />
        <StatCard
          title="Tickets validados"
          value={metrics.recientes.filter((item) => item.alerta_gps === "VALIDADO").length.toString()}
          caption="Conciliacion geografica sin observaciones"
          icon={CheckCircle}
          tone="success"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Acceso rapido
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Modulos principales del frontend
              </h3>
            </div>
            <Link
              href="/activos"
              className="hidden text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900 md:inline-flex"
            >
              Ver estructura completa
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {quickAccess.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="mt-4 text-lg font-semibold text-slate-900">
                    {item.title}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                    Abrir modulo
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Seguimiento
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">
            Alertas recientes para resolucion
          </h3>
          <div className="mt-6 space-y-4">
            {openAlerts.length === 0 ? (
              <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
                No hay alertas GPS abiertas en este momento.
              </div>
            ) : (
              openAlerts.map((item) => (
                <div
                  key={item.id_ticket}
                  className="rounded-[24px] border border-rose-200 bg-rose-50 p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-600 text-white">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-rose-950">
                        Falla de ubicacion detectada
                      </h4>
                      <p className="mt-1 text-sm text-rose-800">
                        Ticket #{item.id_ticket} · Propiedad {item.id_propiedad}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Gasto: ${item.monto_pagado} · Estado GPS: {item.alerta_gps}
                      </p>
                      <a
                        href={getApiUrl(`/api/acta/${item.id_ticket}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
                      >
                        Descargar acta de inspeccion
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </>
  );
}
