import Link from "next/link";
import { ArrowRight, Boxes, ClipboardCheck, Package, ShieldAlert } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";

const reportCards = [
  { title: "Consumo y presupuesto", description: "Stock, gasto validado y reposición.", href: "/consumibles", icon: Package },
  { title: "Riesgo geográfico", description: "Tickets con alerta GPS y seguimiento.", href: "/auditoria", icon: ShieldAlert },
  { title: "Inventario físico", description: "Cobertura y activos validados.", href: "/activos", icon: Boxes },
];

export default function ReportesPage() {
  return (
    <>
      <PageHeader title="Reportes" description="Acceso rápido a los módulos de análisis." />
      <div className="grid gap-3 md:grid-cols-3">
        {reportCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.href}
              className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:bg-slate-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">{card.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{card.description}</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
