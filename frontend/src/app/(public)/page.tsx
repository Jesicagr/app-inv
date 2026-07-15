import Link from "next/link";
import { ArrowRight, ShieldCheck, MapPin, ClipboardCheck, Package, Boxes, FileEdit, Building2 } from "lucide-react";

const features = [
  { icon: MapPin, title: "Georreferenciación", description: "Validación GPS de cada inspección con comparación contra coordenadas oficiales." },
  { icon: ClipboardCheck, title: "Auditoría de Gastos", description: "Control financiero contra catálogo de precios con alertas de sobrecosto del 15%." },
  { icon: Package, title: "Control de Stock", description: "Gestión de consumibles con semáforo de stock mínimo y ajustes de inventario." },
  { icon: Boxes, title: "Activos Fijos", description: "Inventario físico con códigos, estados y mapa interactivo por propiedad." },
  { icon: FileEdit, title: "Requerimientos", description: "Flujo de solicitudes, asignación y cierre con dictamen automático." },
  { icon: Building2, title: "Transparencia", description: "Dashboard público de integridad con gastos, actas y mapa de activos." },
];

export default function LandingPage() {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[32px] bg-slate-900 px-6 py-16 md:px-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[20px] bg-white/10 backdrop-blur-sm">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            SIAR
          </h1>
          <p className="mt-4 text-xl text-slate-300">
            Sistema de Integridad de Activos y Recursos
          </p>
          <p className="mt-6 text-lg leading-relaxed text-slate-400 max-w-2xl mx-auto">
            Plataforma integral para la gestión, auditoría geográfica y control financiero
            de activos institucionales. Validación GPS, alertas de sobrecosto y transparencia total.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/publico"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
            >
              <ShieldCheck className="h-4 w-4" />
              Dashboard de Integridad
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-slate-600 px-6 py-3.5 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
            >
              Ingresar al Sistema
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Capillas", value: "6" },
          { label: "Activos Registrados", value: "20" },
          { label: "Consumibles", value: "12" },
          { label: "Alertas Activas", value: "—" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-[24px] border border-slate-200 bg-white p-5 text-center shadow-sm">
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="space-y-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Módulos del Sistema</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Funcionalidades principales</h2>
          <p className="mt-2 text-slate-500">Cada módulo está diseñado para un aspecto específico de la gestión.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm md:p-12">
        <h2 className="text-2xl font-semibold text-slate-900">¿Necesita acceder al panel de administración?</h2>
        <p className="mt-3 text-slate-500 max-w-xl mx-auto">
          Inicie sesión con sus credenciales para gestionar activos, consumibles, auditorías y más.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Iniciar Sesión
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/publico"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Ver Dashboard Público
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-slate-400">
        <p>SIAR — Sistema de Integridad de Activos y Recursos</p>
      </footer>
    </div>
  );
}
