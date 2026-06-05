"use client";

import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  ClipboardCheck,
  Package,
  ShieldAlert,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";

const reportCards = [
  {
    title: "Consumo y presupuesto",
    description: "Compara salidas de stock, gasto validado y necesidad de reposicion.",
    href: "/consumibles",
    icon: Package,
  },
  {
    title: "Riesgo geografico",
    description: "Agrupa tickets con alerta GPS y observaciones de seguimiento.",
    href: "/auditoria",
    icon: ShieldAlert,
  },
  {
    title: "Inventario fisico",
    description: "Resume cobertura, activos validados y desvio por ubicacion.",
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
        description="Creamos una seccion propia para que el frontend ya tenga un lugar claro donde consolidar analitica, indicadores y accesos rapidos por tema."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Reportes listos"
          value="3"
          caption="Bloques iniciales para consumo, auditoria e inventario"
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
          value="5 modulos"
          caption="Conecta dashboard, consumibles, activos y auditoria"
          icon={Boxes}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {reportCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.title}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
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
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900"
              >
                Abrir modulo relacionado
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          );
        })}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Proximo paso
        </p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">
          Que ya queda encaminado
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
          Con esta estructura, el frontend ya tiene una jerarquia estable. El siguiente paso natural es conectar reportes a datos reales del backend y reemplazar los valores de referencia por metricas filtrables.
        </p>
      </section>
    </>
  );
}
