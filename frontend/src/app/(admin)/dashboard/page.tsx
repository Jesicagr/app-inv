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
  Building2,
  DollarSign,
  Users,
  Globe,
} from "lucide-react";
import PageHeader from "../../../components/ui/PageHeader";
import StatCard from "../../../components/ui/StatCard";
import { serverApi } from "../../../lib/server-api";

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
  total_activos: number;
  alertas_criticas: number;
  requerimientos_pendientes: number;
  recientes: GastoReciente[];
};

const modules = [
  { href: "/consumibles", label: "Consumibles", description: "Stock, alertas y reposición de insumos.", icon: Package },
  { href: "/activos", label: "Activos fijos", description: "Inventario físico, validación GPS y mapa.", icon: Boxes },
  { href: "/requerimientos", label: "Requerimientos", description: "Solicitudes, asignación y cierre con auditoría.", icon: FileEdit },
  { href: "/auditoria", label: "Auditoría", description: "Registro técnico y dictamen de inspecciones.", icon: ClipboardCheck },
  { href: "/propiedades", label: "Propiedades", description: "Capillas, centros y ubicaciones oficiales.", icon: Building2 },
  { href: "/catalogo", label: "Catálogo", description: "Precios de referencia para control financiero.", icon: DollarSign },
  { href: "/usuarios", label: "Usuarios", description: "Gestión de usuarios, roles y asignaciones.", icon: Users },
  { href: "/publico", label: "Transparencia", description: "Rendición de cuentas y consulta ciudadana.", icon: Globe },
];

export default async function Dashboard() {
  let metrics: DashboardMetrics = {
    total_activos: 0,
    alertas_criticas: 0,
    requerimientos_pendientes: 0,
    recientes: [],
  };

  try {
    metrics = await serverApi.get<DashboardMetrics>("/api/dashboard");
  } catch {
    // fallback defaults
  }

  const openAlerts = metrics.recientes.filter(
    (item) => item.alerta_gps !== "VALIDADO" || item.alerta_financiera !== "OK",
  );

  return (
    <>
      <PageHeader
        title="Tablero de control"
        description="Monitoreo centralizado de activos, stock, auditoría geográfica y control financiero."
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
          caption="Bienes durables registrados en el sistema"
          icon={Boxes}
          tone="success"
        />
        <StatCard
          title="Alertas críticas"
          value={metrics.alertas_criticas.toString()}
          caption="GPS o financieras pendientes de revisión"
          icon={ShieldAlert}
          tone={metrics.alertas_criticas > 0 ? "danger" : "success"}
        />
        <StatCard
          title="Req. pendientes"
          value={metrics.requerimientos_pendientes.toString()}
          caption="Solicitudes sin asignar o en proceso"
          icon={FileEdit}
          tone={metrics.requerimientos_pendientes > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Alertas activas"
          value={openAlerts.length.toString()}
          caption="Tickets requiriendo atención inmediata"
          icon={AlertTriangle}
          tone={openAlerts.length > 0 ? "danger" : "success"}
        />
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Acceso rápido
        </p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">
          Módulos del sistema
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Navegación directa a cada área operativa del SIAR.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map(({ href, label, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-[20px] border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white transition-colors group-hover:bg-slate-800">
                <Icon className="h-5 w-5" />
              </div>
              <h4 className="mt-4 font-semibold text-slate-900">{label}</h4>
              <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
            </Link>
          ))}
        </div>
      </section>

      {metrics.recientes.length > 0 && (
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Actividad reciente
              </p>
              <h3 className="text-xl font-semibold text-slate-900">
                Últimas inspecciones registradas
              </h3>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <th className="pb-3 pr-4">Ticket</th>
                  <th className="pb-3 pr-4">Propiedad</th>
                  <th className="pb-3 pr-4">Servicio</th>
                  <th className="pb-3 pr-4">Monto</th>
                  <th className="pb-3 pr-4">Fecha</th>
                  <th className="pb-3 pr-4">GPS</th>
                  <th className="pb-3">Dictamen</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recientes.map((g) => (
                  <tr key={g.id_ticket} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-mono text-xs text-slate-500">#{g.id_ticket}</td>
                    <td className="py-3 pr-4 text-slate-700">{g.nombre_propiedad || g.id_propiedad}</td>
                    <td className="py-3 pr-4 text-slate-600">{g.id_servicio}</td>
                    <td className="py-3 pr-4 font-medium text-slate-900">${g.monto_pagado?.toFixed(2)}</td>
                    <td className="py-3 pr-4 text-xs text-slate-500">{g.fecha_registro}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        g.alerta_gps === "VALIDADO"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}>
                        {g.alerta_gps === "VALIDADO" ? "OK" : "ALERTA"}
                      </span>
                    </td>
                    <td className="py-3">
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
