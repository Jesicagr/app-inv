"use client";

import { Bell, Search, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  getCurrentNavigationItem,
  navigationItems,
} from "../lib/navigation";

export default function AppHeader() {
  const pathname = usePathname();
  const currentItem = getCurrentNavigationItem(pathname);
  const CurrentIcon = currentItem.icon;

  return (
    <header className="shrink-0 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur md:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Modulo activo
          </p>
          <div className="mt-1 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <CurrentIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold text-slate-900">
                {currentItem.label}
              </h1>
              <p className="truncate text-sm text-slate-500">
                {currentItem.description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative block w-full md:w-[360px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Buscar modulo"
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-900 focus:bg-white"
              placeholder={`Buscar en ${currentItem.shortLabel.toLowerCase()}...`}
              type="text"
            />
          </label>

          <div className="flex items-center justify-between gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 xl:flex">
              <span>{navigationItems.length} modulos</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>Operacion local</span>
            </div>

            <button className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
              <Bell className="h-5 w-5" />
            </button>
            <button className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
              <Settings className="h-5 w-5" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
              ADM
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
