import Link from "next/link";
import { ArrowRight, Boxes, ClipboardCheck, Package, ShieldAlert } from "lucide-react";
import PageHeader from "../../../components/ui/PageHeader";
import StatCard from "../../../components/ui/StatCard";

const reportCards = [
  {
    title: "Consumo y presupuesto",
    description: "Compara salidas de stock, gasto validado y necesidad de reposición.",
    href: "/consumibles",
    icon: Package,
  },
  {
    title: "Riesgo geográfico",
    description: "Agrupa tickets con alerta GPS y observaciones de seguimiento.",
    href: "/auditoria",
    icon: ShieldAlert,
  },
  {
    title: "Inventario físico",
    description: "Resume cobertura, activos validados y desvío por ubicación.",
    href: "/activos",
    icon: Boxes,
  },
];

export default function ReportesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Resumen ejecutivo"
        title="Reportes"
        description="Sección centralizada para análisis, indicadores y acceso rápido a los reportes operativos del sistema."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Reportes disponibles"
          value="3"
          caption="Bloques iniciales para consumo, auditoría e inventario"
          icon={ClipboardCheck}
        />
        <StatCard
          title="Prioridad"
          value="Alta"
          caption="Sirve como hub para decisiones operativas"
          icon={ShieldAlert}
          tone="warning"
        />
        <StatCard
          title="Cobertura"
          value="5 módulos"
          caption="Conecta dashboard, consumibles, activos y auditoría"
          icon={Boxes}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {reportCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.title}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-900">
                {card.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {card.description}
              </p>
              <Link
                href={card.href}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition-colors hover:text-slate-700"
              >
                Abrir módulo relacionado
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          );
        })}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Próximo paso
        </p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">
          Hacia dónde vamos
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
          Con esta estructura, el sistema ya tiene una jerarquía estable. El siguiente paso natural es conectar reportes a datos históricos del backend y reemplazar los valores de referencia por métricas filtrables por rango de fechas y propiedad.
        </p>
      </section>
    </>
  );
}
