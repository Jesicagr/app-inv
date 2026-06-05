"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, MapPin } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import { getApiUrl } from "../../lib/api";

type Propiedad = {
  id_propiedad: string;
  nombre: string;
  direccion: string;
  lat_oficial: number;
  lon_oficial: number;
};

export default function PropiedadesPage() {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; edit?: Propiedad }>({ open: false });
  const [form, setForm] = useState({ id_propiedad: "", nombre: "", direccion: "", lat_oficial: "", lon_oficial: "" });
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/propiedades"));
      setPropiedades(await res.json());
    } catch { setPropiedades([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => {
    setForm({ id_propiedad: "", nombre: "", direccion: "", lat_oficial: "", lon_oficial: "" });
    setModal({ open: true });
  };

  const abrirEditar = (p: Propiedad) => {
    setForm({
      id_propiedad: p.id_propiedad,
      nombre: p.nombre,
      direccion: p.direccion || "",
      lat_oficial: p.lat_oficial?.toString() || "",
      lon_oficial: p.lon_oficial?.toString() || "",
    });
    setModal({ open: true, edit: p });
  };

  const guardar = async () => {
    setSaving(true);
    const data = new FormData();
    data.append("id_propiedad", form.id_propiedad);
    data.append("nombre", form.nombre);
    data.append("direccion", form.direccion);
    if (form.lat_oficial) data.append("lat_oficial", form.lat_oficial);
    if (form.lon_oficial) data.append("lon_oficial", form.lon_oficial);

    const url = modal.edit
      ? getApiUrl(`/api/propiedades/${modal.edit.id_propiedad}`)
      : getApiUrl("/api/propiedades");
    const method = modal.edit ? "PUT" : "POST";

    try {
      await fetch(url, { method, body: data });
      setModal({ open: false });
      cargar();
    } catch { alert("Error al guardar"); }
    finally { setSaving(false); }
  };

  const eliminar = async (id: string) => {
    if (!confirm("Eliminar esta propiedad y todas sus asignaciones?")) return;
    try {
      await fetch(getApiUrl(`/api/propiedades/${id}`), { method: "DELETE" });
      cargar();
    } catch { alert("Error al eliminar"); }
  };

  return (
    <>
      <PageHeader
        title="Propiedades"
        description="Gestion de capillas, centros de reunion y propiedades."
      />

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Inmuebles</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Propiedades del sistema</h3>
          </div>
          <button onClick={abrirNuevo} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
            <Plus className="h-4 w-4" /> Nueva propiedad
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
                  <th className="pb-3 pr-4">Nombre</th>
                  <th className="pb-3 pr-4">Dirección</th>
                  <th className="pb-3 pr-4">Coordenadas</th>
                  <th className="pb-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {propiedades.map((p) => (
                  <tr key={p.id_propiedad} className="border-b border-slate-100 last:border-0">
                    <td className="py-4 pr-4 font-mono text-xs font-medium text-slate-500">{p.id_propiedad}</td>
                    <td className="py-4 pr-4 font-medium text-slate-900">{p.nombre}</td>
                    <td className="py-4 pr-4 text-slate-500">{p.direccion || "—"}</td>
                    <td className="py-4 pr-4">
                      {p.lat_oficial && p.lon_oficial ? (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3 w-3" />
                          {p.lat_oficial.toFixed(4)}, {p.lon_oficial.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">Sin ubicación</span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => abrirEditar(p)} className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => eliminar(p.id_propiedad)} className="rounded-full p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {propiedades.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-slate-400">No hay propiedades registradas</td>
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
              <h3 className="text-xl font-semibold text-slate-900">{modal.edit ? "Editar propiedad" : "Nueva propiedad"}</h3>
              <button onClick={() => setModal({ open: false })} className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Código</label>
                <input
                  type="text"
                  value={form.id_propiedad}
                  onChange={(e) => setForm({ ...form, id_propiedad: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
                  placeholder="Ej. CAP-007"
                  disabled={!!modal.edit}
                  required
                />
                {modal.edit && <p className="mt-1 text-xs text-slate-400">El código no se puede modificar</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nombre</label>
                <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900" required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Dirección</label>
                <input type="text" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Latitud</label>
                  <input type="number" step="any" value={form.lat_oficial} onChange={(e) => setForm({ ...form, lat_oficial: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900" placeholder="-34.6037" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Longitud</label>
                  <input type="number" step="any" value={form.lon_oficial} onChange={(e) => setForm({ ...form, lon_oficial: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900" placeholder="-58.3816" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setModal({ open: false })} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50">Cancelar</button>
                <button onClick={guardar} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-400">
                  {saving ? "Guardando..." : modal.edit ? "Actualizar" : "Crear propiedad"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
