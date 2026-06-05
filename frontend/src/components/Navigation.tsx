"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "../lib/navigation";

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950 px-1 py-1 text-slate-400 md:top-0 md:bottom-auto md:flex md:h-full md:w-56 md:flex-col md:border-r md:border-t-0 md:px-3 md:py-4">
      <div className="hidden md:mb-4 md:block md:px-2">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">SIAR</p>
      </div>

      <div className="flex md:flex-col md:gap-0.5">
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
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-center transition-colors md:flex-row md:gap-3 md:px-3 md:py-2.5 md:text-left ${
                isActive
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                isActive ? "bg-slate-950 text-white" : "text-slate-400"
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-semibold md:text-sm md:font-medium">
                {item.shortLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
