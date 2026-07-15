"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "../lib/navigation";

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950 text-slate-400 md:top-0 md:bottom-auto md:flex md:h-full md:w-64 md:flex-col md:border-r md:border-t-0">
      {/* Brand */}
      <div className="hidden shrink-0 border-b border-slate-800 px-5 py-5 md:block">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">SIAR</p>
        <p className="mt-1 text-sm leading-5 text-slate-400">
          Sistema de Integridad de Activos y Recursos
        </p>
      </div>

      {/* Items */}
      <div className="flex overflow-y-auto px-2 py-2 md:flex-col md:gap-0.5 md:px-3 md:py-3">
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
              className={`group flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-center transition-colors md:flex-row md:gap-2.5 md:px-3 md:py-2.5 md:text-left ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg md:h-8 md:w-8 ${
                isActive ? "bg-white/10 text-white" : "text-slate-400"
              }`}>
                <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </div>
              <span className="text-[10px] font-semibold md:text-sm md:font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
