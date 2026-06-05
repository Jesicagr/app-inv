"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "../lib/navigation";

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950 px-2 py-2 text-slate-400 md:top-0 md:bottom-auto md:flex md:h-full md:w-72 md:flex-col md:justify-between md:border-r md:border-t-0 md:px-6 md:py-7">
      <div>
        <div className="mb-6 hidden md:block">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Asset Steward
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Operacion institucional
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Dashboard, inventario, auditoria y reportes en una sola vista de trabajo.
          </p>
        </div>

        <div className="grid grid-cols-5 gap-1 md:grid-cols-1 md:gap-2">
          {navigationItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex flex-col items-center justify-center gap-2 rounded-2xl px-2 py-3 text-center transition-all md:flex-row md:items-start md:justify-start md:px-4 md:py-3 md:text-left ${
                  isActive
                    ? "bg-white text-slate-950 shadow-lg shadow-slate-950/15"
                    : "hover:bg-slate-900 hover:text-white"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                    isActive
                      ? "bg-slate-950 text-white"
                      : "bg-slate-900 text-slate-300 group-hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold md:text-sm">
                    {item.shortLabel}
                  </p>
                  <p className="mt-0.5 hidden text-xs leading-5 text-slate-500 md:block">
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-6 hidden rounded-[24px] border border-slate-800 bg-slate-900/80 p-4 md:block">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Estado
        </p>
        <p className="mt-2 text-sm font-medium text-white">
          Frontend listo para crecer por modulos.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          La navegacion ya contempla dashboard, consumibles, activos, auditoria y reportes.
        </p>
      </div>
    </nav>
  );
}
