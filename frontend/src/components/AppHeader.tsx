"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Search, LogOut, Loader2, AlertTriangle, ClipboardList, Package, Wrench } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  getCurrentNavigationItem,
  navigationItems,
} from "../lib/navigation";
import { useAuth } from "../lib/AuthContext";
import { getApiUrl } from "../lib/api";

type SearchResult = {
  id: string;
  texto: string;
  tipo: string;
};

type NotificacionItem = {
  tipo: string;
  mensaje: string;
  enlace: string;
};

type Notificaciones = {
  total: number;
  items: NotificacionItem[];
};

const TIPO_HREF: Record<string, string> = {
  propiedad: "/propiedades",
  activo: "/activos",
  consumible: "/consumibles",
  requerimiento: "/requerimientos",
};

const TIPO_LABEL: Record<string, string> = {
  propiedad: "Propiedad",
  activo: "Activo fijo",
  consumible: "Consumible",
  requerimiento: "Requerimiento",
};

const NOTIF_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  alerta_gasto: AlertTriangle,
  requerimiento: ClipboardList,
  stock_bajo: Package,
  reparacion: Wrench,
};

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificaciones>({ total: 0, items: [] });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const currentItem = getCurrentNavigationItem(pathname);
  const CurrentIcon = currentItem.icon;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(getApiUrl(`/api/buscar?q=${encodeURIComponent(query)}`));
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  useEffect(() => {
    const fetchNotif = async () => {
      try {
        const res = await fetch(getApiUrl("/api/notificaciones"));
        setNotificaciones(await res.json());
      } catch {}
    };
    fetchNotif();
    const interval = setInterval(fetchNotif, 30000);
    return () => clearInterval(interval);
  }, []);

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
          <div ref={searchRef} className="relative w-full md:w-[360px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Buscar"
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-900 focus:bg-white"
              placeholder="Buscar propiedades, activos, consumibles..."
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (results.length > 0) setShowResults(true); }}
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
            )}
            {showResults && results.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                {results.map((r, i) => (
                  <button
                    key={`${r.tipo}-${r.id}-${i}`}
                    onClick={() => {
                      const href = TIPO_HREF[r.tipo];
                      if (href) router.push(href);
                      setShowResults(false);
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50"
                  >
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                      {TIPO_LABEL[r.tipo] || r.tipo}
                    </span>
                    <span className="truncate text-slate-700">{r.texto}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 xl:flex">
              <span>{navigationItems.length} modulos</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>Operacion local</span>
            </div>

            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                {notificaciones.total > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
                    {notificaciones.total}
                  </span>
                )}
                <Bell className="h-5 w-5" />
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {notificaciones.total > 0 ? "Notificaciones" : "Sin notificaciones"}
                      </p>
                    </div>
                    {notificaciones.items.length > 0 ? (
                      <div className="max-h-64 overflow-y-auto">
                        {notificaciones.items.map((n, i) => {
                          const Icon = NOTIF_ICON[n.tipo] || Bell;
                          return (
                            <button
                              key={i}
                              onClick={() => { router.push(n.enlace); setNotifOpen(false); }}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50"
                            >
                              <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                              <span className="text-slate-700">{n.mensaje}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center text-sm text-slate-400">
                        Todo en orden
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white transition-colors hover:bg-slate-800"
              >
                {usuario?.nombre?.charAt(0).toUpperCase() || "?"}
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{usuario?.nombre}</p>
                      <p className="text-xs text-slate-500">{usuario?.email}</p>
                      <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {usuario?.rol}
                      </span>
                    </div>
                    <button
                      onClick={() => { logout(); router.push("/login"); }}
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesion
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
