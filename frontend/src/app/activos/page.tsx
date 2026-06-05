"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  X,
  Wrench,
  Boxes,
  Map,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Pagination from "../../components/ui/Pagination";
import { getApiUrl } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";

const MapaActivos = dynamic(() => import("../../components/MapaActivos"), { ssr: false, loading: () => null });

type ActivoFijo = {
  id_activo: number;
  id_propiedad: string;
  nombre: string;
  descripcion: string;
  estado: string;
  codigo_inventario: string;
  url_foto: string;
};

type Propiedad = {
  id_propiedad: string;
  nombre: string;
};

const ESTADOS = ["EXCELENTE", "BUENO", "REQUIERE_REPARACION", "OBSOLETO"];

export default function ActivosFijosPage() {
  const { usuario } = useAuth();
  const [activos, setActivos] = useState<ActivoFijo[]>([]);
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modal, setModal] = useState<{ open: boolean; edit?: ActivoFijo }>({ open: false });
  const [form, setForm] = useState({ id_propiedad: "", nombre: "", descripcion: "", estado: "BUENO", codigo_inventario: "", url_foto: "" });
  const [saving, setSaving] = useState(false);
  const [reportando, setReportando] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [mapaVisible, setMapaVisible] = useState(false);

  const esPropiedades = usuario?.rol === "PROPIEDADES";

  const cargar = useCallback((p: number = 1) => {
    setLoading(true);
    const url = esPropiedades && usuario
      ? `/api/activos?id_usuario=${usuario.id}&page=${p}&per_page=200`
      : `/api/activos?page=${p}&per_page=200`;
    const propUrl = esPropiedades && usuario ? `/api/propiedades?id_usuario=${usuario.id}` : "/api/propiedades";
    Promise.all([
      fetch(getApiUrl(url)).then((r) => r.json()),
      fetch(getApiUrl(propUrl)).then((r) => r.json()),
    ]).then(([a, pr]) => {
      const pag = a.data ? a : { data: a, total: a.length, page: 1, pages: 1 };
      setActivos(pag.data);
      setPage(pag.page);
      setPages(pag.pages);
      setTotal(pag.total);
      setPropiedades(pr);
    }).catch(() => setActivos([])).finally(() => setLoading(false));
  }, [esPropiedades, usuario]);

  useEffect(() => { cargar(page); }, [usuario, page]);

  const reportarActivo = async (id: number) => {
    setReportando(id);
    try {
      const res = await fetch(getApiUrl(`/api/activos/${id}/reportar`), { method: "POST" });
      if (!res.ok) throw new Error();
      cargar();
    } catch { alert("Error"); } finally { setReportando(null); }
  };

  const abrirNuevo = () => {
    setForm({ id_propiedad: propiedades[0]?.id_propiedad || "", nombre: "", descripcion: "", estado: "BUENO", codigo_inventario: "", url_foto: "" });
    setModal({ open: true });
  };

  const abrirEditar = (a: ActivoFijo) => {
    setForm({ id_propiedad: a.id_propiedad, nombre: a.nombre, descripcion: a.descripcion, estado: a.estado, codigo_inventario: a.codigo_inventario, url_foto: a.url_foto });
    setModal({ open: true, edit: a });
  };

  const guardar = async () => {
    setSaving(true);
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    const url = modal.edit ? getApiUrl(`/api/activos/${modal.edit.id_activo}`) : getApiUrl("/api/activos");
    try {
      const res = await fetch(url, { method: modal.edit ? "PUT" : "POST", body: data });
      if (!res.ok) throw new Error();
      setModal({ open: false }); cargar();
    } catch { alert("Error"); } finally { setSaving(false); }
  };

  const eliminar = async (id: number) => {
    if (!confirm("Eliminar?")) return;
    try { await fetch(getApiUrl(`/api/activos/${id}`), { method: "DELETE" }); cargar(); }
    catch { alert("Error"); }
  };

  const totalMalo = activos.filter((a) => a.estado === "OBSOLETO" || a.estado === "REQUIERE_REPARACION").length;
  const filtrados = filtroEstado ? activos.filter((a) => a.estado === filtroEstado) : activos;

  const getPropName = (id: string) => propiedades.find((p) => p.id_propiedad === id)?.nombre || id;

  return (
    <>
      <PageHeader
        title="Activos fijos"
        description="Inventario físico de bienes durables."
        actions={
          <div className="flex gap-2">
            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
              value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="">Todos</option>
              {ESTADOS.map((e) => <option key={e} value={e}>{e.replace("_", " ")}</option>)}
            </select>
            <button onClick={abrirNuevo} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              <Plus className="h-4 w-4" /> Nuevo
            </button>
          </div>
        }
      />

      {totalMalo > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-rose-800">
            <AlertTriangle className="h-4 w-4" />
            {totalMalo} activo{totalMalo > 1 ? "s" : ""} requiere{totalMalo <= 1 ? "" : "n"} atención
          </div>
        </div>
      )}

      <button onClick={() => setMapaVisible(!mapaVisible)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
        <Map className="h-4 w-4" />
        {mapaVisible ? "Ocultar mapa" : "Ver mapa de propiedades"}
      </button>

      {mapaVisible && <MapaActivos />}

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-slate-400">Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 text-sm text-slate-400">Sin activos</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((a) => {
            const tone = a.estado === "OBSOLETO" ? "danger" : a.estado === "REQUIERE_REPARACION" ? "warning" : "success";
            return (
              <div key={a.id_activo} className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{a.nombre}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        tone === "success" ? "bg-emerald-100 text-emerald-700" :
                        tone === "warning" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                      }`}>{a.estado.replace("_", " ")}</span>
                    </div>
                    {a.descripcion && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{a.descripcion}</p>}
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="h-3 w-3" />
                      {getPropName(a.id_propiedad)}
                      {a.codigo_inventario && <span className="ml-2 font-mono">{a.codigo_inventario}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {a.estado !== "REQUIERE_REPARACION" && a.estado !== "OBSOLETO" && (
                      <button onClick={() => reportarActivo(a.id_activo)} disabled={reportando === a.id_activo}
                        className="rounded-lg p-1.5 text-amber-600 transition-colors hover:bg-amber-50" title="Reportar daño">
                        <Wrench className={`h-4 w-4 ${reportando === a.id_activo ? "animate-spin" : ""}`} />
                      </button>
                    )}
                    <button onClick={() => abrirEditar(a)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => eliminar(a.id_activo)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} pages={pages} total={total} perPage={200} onChange={(p) => { setPage(p); cargar(p); }} />

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">{modal.edit ? "Editar" : "Nuevo activo"}</h3>
              <button onClick={() => setModal({ open: false })} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <select value={form.id_propiedad} onChange={(e) => setForm({ ...form, id_propiedad: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900" required>
                <option value="">Seleccionar</option>
                {propiedades.map((p) => <option key={p.id_propiedad} value={p.id_propiedad}>{p.nombre || p.id_propiedad}</option>)}
              </select>
              <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900" placeholder="Nombre" required />
              <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900" rows={2} placeholder="Descripción (opcional)" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900">
                  {ESTADOS.map((e) => <option key={e} value={e}>{e.replace("_", " ")}</option>)}
                </select>
                <input type="text" value={form.codigo_inventario} onChange={(e) => setForm({ ...form, codigo_inventario: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900" placeholder="Código (opcional)" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setModal({ open: false })} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">Cancelar</button>
                <button onClick={guardar} disabled={saving}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400">
                  {saving ? "..." : modal.edit ? "Actualizar" : "Crear"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
