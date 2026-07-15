"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Tag } from "lucide-react";
import PageHeader from "../../../components/ui/PageHeader";
import { getApiUrl } from "../../../lib/api";

type CatalogoItem = {
  id_servicio: string;
  descripcion: string;
  precio_mercado: number;
  tipo_item: string;
};

const TIPOS = ["PRODUCTO", "SERVICIO", "MANTENIMIENTO", "LIMPIEZA", "SEGURIDAD"];

export default function CatalogoPage() {
  const [items, setItems] = useState<CatalogoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; edit?: CatalogoItem }>({ open: false });
  const [form, setForm] = useState({ id_servicio: "", descripcion: "", precio_mercado: "", tipo_item: "PRODUCTO" });
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/catalogo_precios"));
      setItems(await res.json());
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => {
    setForm({ id_servicio: "", descripcion: "", precio_mercado: "", tipo_item: "PRODUCTO" });
    setModal({ open: true });
  };

  const abrirEditar = (item: CatalogoItem) => {
    setForm({
      id_servicio: item.id_servicio,
      descripcion: item.descripcion || "",
      precio_mercado: item.precio_mercado?.toString() || "",
      tipo_item: item.tipo_item || "PRODUCTO",
    });
    setModal({ open: true, edit: item });
  };

  const guardar = async () => {
    setSaving(true);
    const data = new FormData();
    data.append("id_servicio", form.id_servicio);
    data.append("descripcion", form.descripcion);
    data.append("precio_mercado", form.precio_mercado);
    data.append("tipo_item", form.tipo_item);

    const url = modal.edit
      ? getApiUrl(`/api/catalogo_precios/${modal.edit.id_servicio}`)
      : getApiUrl("/api/catalogo_precios");
    const method = modal.edit ? "PUT" : "POST";

    try {
      await fetch(url, { method, body: data });
      setModal({ open: false });
      cargar();
    } catch { alert("Error al guardar"); }
    finally { setSaving(false); }
  };

  const eliminar = async (id: string) => {
    if (!confirm("Eliminar este item del catálogo?")) return;
    try {
      await fetch(getApiUrl(`/api/catalogo_precios/${id}`), { method: "DELETE" });
      cargar();
    } catch { alert("Error al eliminar"); }
  };

  return (
    <>
      <PageHeader
        title="Catálogo de Precios"
        description="Gestión de servicios, productos y precios de referencia para auditoría."
      />

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Referencias</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Catálogo de precios</h3>
          </div>
          <button onClick={abrirNuevo} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
            <Plus className="h-4 w-4" /> Nuevo item
          </button>
        </div>

        {loading ? (
          <div className="mt-6 flex h-40 items-center justify-center text-sm text-slate-400">Cargando...</div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <th className="pb-3 pr-4">Código</th>
                  <th className="pb-3 pr-4">Descripción</th>
                  <th className="pb-3 pr-4">Tipo</th>
                  <th className="pb-3 pr-4">Precio mercado</th>
                  <th className="pb-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id_servicio} className="border-b border-slate-100 last:border-0">
                    <td className="py-4 pr-4 font-mono text-xs font-medium text-slate-500">{item.id_servicio}</td>
                    <td className="py-4 pr-4 font-medium text-slate-900">{item.descripcion || "—"}</td>
                    <td className="py-4 pr-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        <Tag className="h-3 w-3" />
                        {item.tipo_item}
                      </span>
                    </td>
                    <td className="py-4 pr-4 font-medium text-slate-900">${item.precio_mercado?.toFixed(2)}</td>
                    <td className="py-4 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => abrirEditar(item)} className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => eliminar(item.id_servicio)} className="rounded-full p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-slate-400">No hay items en el catálogo</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">{modal.edit ? "Editar item" : "Nuevo item"}</h3>
              <button onClick={() => setModal({ open: false })} className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Código</label>
                <input
                  type="text"
                  value={form.id_servicio}
                  onChange={(e) => setForm({ ...form, id_servicio: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
                  placeholder="Ej. PINTURA"
                  disabled={!!modal.edit}
                  required
                />
                {modal.edit && <p className="mt-1 text-xs text-slate-400">El código no se puede modificar</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Descripción</label>
                <input type="text" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Precio mercado</label>
                  <input type="number" step="0.01" value={form.precio_mercado} onChange={(e) => setForm({ ...form, precio_mercado: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900" placeholder="0.00" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tipo</label>
                  <select value={form.tipo_item} onChange={(e) => setForm({ ...form, tipo_item: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900">
                    {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setModal({ open: false })} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50">Cancelar</button>
                <button onClick={guardar} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-400">
                  {saving ? "Guardando..." : modal.edit ? "Actualizar" : "Crear item"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
