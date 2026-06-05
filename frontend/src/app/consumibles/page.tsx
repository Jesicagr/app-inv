"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { AlertTriangle, Package, Plus, Pencil, Trash2, X, PlusCircle, MinusCircle, Circle } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Pagination from "../../components/ui/Pagination";
import { getApiUrl } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";

type Consumible = {
  id_consumible: number;
  id_propiedad: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  unidad_medida: string;
  nombre_propiedad: string | null;
};

type Propiedad = {
  id_propiedad: string;
  nombre: string;
};

export default function ConsumiblesPage() {
  const { usuario } = useAuth();
  const [consumibles, setConsumibles] = useState<Consumible[]>([]);
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filtroProp, setFiltroProp] = useState("");
  const [modal, setModal] = useState<{ open: boolean; edit?: Consumible }>({ open: false });
  const [ajusteId, setAjusteId] = useState<number | null>(null);
  const [ajusteCant, setAjusteCant] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    id_propiedad: "", nombre: "", stock_actual: 0, stock_minimo: 0, unidad_medida: "unidades",
  });

  const esPropiedades = usuario?.rol === "PROPIEDADES";

  const cargar = useCallback((p: number = 1) => {
    setLoading(true);
    let url = `/api/consumibles?page=${p}&per_page=200`;
    if (esPropiedades && usuario && !filtroProp) url = `/api/consumibles?id_usuario=${usuario.id}&page=${p}&per_page=200`;
    else if (filtroProp) url = `/api/consumibles?id_propiedad=${filtroProp}&page=${p}&per_page=200`;
    const propUrl = esPropiedades && usuario ? `/api/propiedades?id_usuario=${usuario.id}` : "/api/propiedades";
    Promise.all([
      fetch(getApiUrl(url)).then((r) => r.json()),
      fetch(getApiUrl(propUrl)).then((r) => r.json()),
    ]).then(([c, pr]) => {
      const pag = c.data ? c : { data: c, total: c.length, page: 1, pages: 1 };
      setConsumibles(pag.data);
      setPage(pag.page);
      setPages(pag.pages);
      setTotal(pag.total);
      setPropiedades(pr);
    }).catch(() => setConsumibles([])).finally(() => setLoading(false));
  }, [esPropiedades, usuario, filtroProp]);

  useEffect(() => { cargar(page); }, [filtroProp, usuario, page]);

  const getPropName = (id: string) => propiedades.find((p) => p.id_propiedad === id)?.nombre || id;

  const criticos = useMemo(() => consumibles.filter((c) => c.stock_actual <= c.stock_minimo), [consumibles]);
  const soloAlertas = criticos.length > 0;

  const abrirNuevo = () => {
    setForm({ id_propiedad: propiedades[0]?.id_propiedad || "", nombre: "", stock_actual: 0, stock_minimo: 0, unidad_medida: "unidades" });
    setModal({ open: true });
  };

  const abrirEditar = (c: Consumible) => {
    setForm({ id_propiedad: c.id_propiedad, nombre: c.nombre, stock_actual: c.stock_actual, stock_minimo: c.stock_minimo, unidad_medida: c.unidad_medida });
    setModal({ open: true, edit: c });
  };

  const guardar = async () => {
    setSaving(true);
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v.toString()));
    const url = modal.edit ? getApiUrl(`/api/consumibles/${modal.edit.id_consumible}`) : getApiUrl("/api/consumibles");
    try { await fetch(url, { method: modal.edit ? "PUT" : "POST", body: data }); setModal({ open: false }); cargar(); }
    catch { alert("Error"); } finally { setSaving(false); }
  };

  const eliminar = async (id: number) => {
    if (!confirm("Eliminar?")) return;
    try { await fetch(getApiUrl(`/api/consumibles/${id}`), { method: "DELETE" }); cargar(); }
    catch { alert("Error"); }
  };

  const ajustarStock = async (id: number) => {
    if (ajusteCant === 0) return;
    const data = new FormData(); data.append("cantidad", ajusteCant.toString());
    try {
      const res = await fetch(getApiUrl(`/api/consumibles/${id}/ajustar`), { method: "POST", body: data });
      if (!res.ok) { const e = await res.json(); alert(e.detail || "Error"); return; }
      setAjusteId(null); setAjusteCant(0); cargar();
    } catch { alert("Error"); }
  };

  const semaforo = (c: Consumible) => {
    const ratio = c.stock_minimo > 0 ? c.stock_actual / c.stock_minimo : 99;
    if (ratio <= 1) return "danger";
    if (ratio <= 2) return "warning";
    return "success";
  };

  return (
    <>
      <PageHeader
        title="Consumibles"
        description="Stock por propiedad con alertas de mínimo."
        actions={
          <div className="flex gap-2">
            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
              value={filtroProp} onChange={(e) => setFiltroProp(e.target.value)}>
              <option value="">Todas</option>
              {propiedades.map((p) => <option key={p.id_propiedad} value={p.id_propiedad}>{p.nombre || p.id_propiedad}</option>)}
            </select>
            <button onClick={abrirNuevo} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              <Plus className="h-4 w-4" /> Nuevo
            </button>
          </div>
        }
      />

      {soloAlertas && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-rose-800">
            <AlertTriangle className="h-4 w-4" />
            {criticos.length} producto{criticos.length > 1 ? "s" : ""} crítico{criticos.length > 1 ? "s" : ""} por debajo del stock mínimo
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-slate-400">Cargando...</div>
      ) : consumibles.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 text-sm text-slate-400">Sin productos registrados</div>
      ) : (
        <div className="grid gap-3">
          {consumibles.map((c) => {
            const st = semaforo(c);
            const color = st === "danger" ? "border-l-rose-500 bg-rose-50" : st === "warning" ? "border-l-amber-500 bg-amber-50" : "border-l-emerald-500";
            const label = st === "danger" ? "Crítico" : st === "warning" ? "Alerta" : "Óptimo";
            return (
              <div key={c.id_consumible} className={`flex items-center gap-4 rounded-xl border border-slate-200 border-l-4 bg-white p-4 ${st === "danger" ? "border-l-rose-500" : st === "warning" ? "border-l-amber-500" : "border-l-emerald-500"}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{c.nombre}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      st === "danger" ? "bg-rose-100 text-rose-700" : st === "warning" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    }`}>{label}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                    <span>{getPropName(c.id_propiedad)}</span>
                    <span>{c.unidad_medida}</span>
                    <span>Stock: <strong className="text-slate-800">{c.stock_actual}</strong> / Mín: {c.stock_minimo}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => { setAjusteId(c.id_consumible); setAjusteCant(0); }}
                    className="rounded-lg p-2 text-sky-600 transition-colors hover:bg-sky-50">
                    <PlusCircle className="h-4 w-4" />
                  </button>
                  <button onClick={() => abrirEditar(c)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => eliminar(c.id_consumible)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} pages={pages} total={total} perPage={200} onChange={(p) => { setPage(p); cargar(p); }} />

      {ajusteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Ajustar stock</h3>
              <button onClick={() => setAjusteId(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <input type="number" value={ajusteCant} onChange={(e) => setAjusteCant(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900" placeholder="Ej. 10 o -5" />
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setAjusteId(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">Cancelar</button>
              <button onClick={() => ajustarStock(ajusteId)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                {ajusteCant > 0 ? <PlusCircle className="h-4 w-4" /> : <MinusCircle className="h-4 w-4" />}
                {ajusteCant > 0 ? "Ingresar" : "Egresar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">{modal.edit ? "Editar" : "Nuevo producto"}</h3>
              <button onClick={() => setModal({ open: false })} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <select value={form.id_propiedad} onChange={(e) => setForm({ ...form, id_propiedad: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900">
                {propiedades.map((p) => <option key={p.id_propiedad} value={p.id_propiedad}>{p.nombre || p.id_propiedad}</option>)}
              </select>
              <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900" placeholder="Nombre" required />
              <div className="grid grid-cols-3 gap-3">
                <input type="number" min="0" value={form.stock_actual} onChange={(e) => setForm({ ...form, stock_actual: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900" placeholder="Stock" />
                <input type="number" min="0" value={form.stock_minimo} onChange={(e) => setForm({ ...form, stock_minimo: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900" placeholder="Mín" />
                <select value={form.unidad_medida} onChange={(e) => setForm({ ...form, unidad_medida: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900">
                  <option value="unidades">unid</option><option value="packs">packs</option><option value="litros">L</option><option value="kilos">kg</option>
                </select>
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
