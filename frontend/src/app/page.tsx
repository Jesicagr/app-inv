import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  FileEdit,
  ClipboardCheck,
  Package,
  Boxes,
  ShieldAlert,
  Receipt,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { serverApi } from "../lib/server-api";

type GastoReciente = {
  id_ticket: number;
  id_propiedad: string;
  nombre_propiedad: string | null;
  id_servicio: string;
  monto_pagado: number;
  fecha_registro: string;
  alerta_financiera: string;
  alerta_gps: string;
  dictamen_final: string;
};

type DashboardMetrics = {
  alertas_criticas: number;
  requerimientos_pendientes: number;
  recientes: GastoReciente[];
};

const quickLinks = [
  { href: "/consumibles", label: "Consumibles", icon: Package },
  { href: "/activos", label: "Activos", icon: Boxes },
  { href: "/auditoria", label: "Auditoría", icon: ClipboardCheck },
  { href: "/requerimientos", label: "Requerimientos", icon: FileEdit },
];

export default async function Dashboard() {
  let metrics: DashboardMetrics = { alertas_criticas: 0, requerimientos_pendientes: 0, recientes: [] };

  try {
    metrics = await serverApi.get<DashboardMetrics>("/api/dashboard");
  } catch {
    // fallback defaults
  }

  return (
    <>
      <PageHeader
        title="Panel"
        description="Resumen rápido del estado del sistema."
      />

      <section className="grid gap-3 md:grid-cols-3">
        <StatCard
          title="Alertas críticas"
          value={metrics.alertas_criticas.toString()}
          caption="GPS o financieras"
          icon={ShieldAlert}
          tone={metrics.alertas_criticas > 0 ? "danger" : "success"}
        />
        <StatCard
          title="Req. pendientes"
          value={metrics.requerimientos_pendientes.toString()}
          caption="Sin asignar"
          icon={FileEdit}
          tone={metrics.requerimientos_pendientes > 0 ? "warning" : "success"}
        />
        <Link
          href="/reportes"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:bg-slate-50"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Reportes</p>
            <p className="mt-1 text-sm text-slate-600">Ver reportes completos</p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400" />
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Módulos</p>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          {quickLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Icon className="h-4 w-4 shrink-0 text-slate-400" />
              {label}
            </Link>
          ))}
        </div>
      </section>

      {metrics.recientes.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Últimos registros</p>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <th className="pb-2 pr-3">Ticket</th>
                  <th className="pb-2 pr-3">Propiedad</th>
                  <th className="pb-2 pr-3">Servicio</th>
                  <th className="pb-2 pr-3">Monto</th>
                  <th className="pb-2 pr-3">Fecha</th>
                  <th className="pb-2 pr-3">Dictamen</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recientes.map((g) => (
                  <tr key={g.id_ticket} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 pr-3 font-mono text-xs text-slate-500">#{g.id_ticket}</td>
                    <td className="py-2.5 pr-3 text-slate-700">{g.nombre_propiedad || g.id_propiedad}</td>
                    <td className="py-2.5 pr-3 text-slate-600">{g.id_servicio}</td>
                    <td className="py-2.5 pr-3 font-medium text-slate-900">${g.monto_pagado?.toFixed(2)}</td>
                    <td className="py-2.5 pr-3 text-xs text-slate-500">{g.fecha_registro}</td>
                    <td className="py-2.5">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        g.dictamen_final === "APROBADO"
                          ? "bg-emerald-50 text-emerald-700"
                          : g.dictamen_final === "RECHAZADO"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-amber-50 text-amber-700"
                      }`}>
                        {g.dictamen_final}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
