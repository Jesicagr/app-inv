"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Building2 } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import { getApiUrl } from "../../lib/api";

type Usuario = {
  id_usuario: number;
  nombre: string;
  email: string;
  id_rol: number;
  nombre_rol: string;
};

type Rol = {
  id_rol: number;
  nombre_rol: string;
};

type Asignacion = {
  id_usuario: number;
  id_propiedad: string;
  nombre_propiedad: string;
};

type Propiedad = {
  id_propiedad: string;
  nombre: string;
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; edit?: Usuario }>({ open: false });
  const [asigModal, setAsigModal] = useState<{ open: boolean; usuario: Usuario | null }>({ open: false, usuario: null });
  const [form, setForm] = useState({ nombre: "", email: "", password: "", id_rol: 1 });
  const [saving, setSaving] = useState(false);

  const cargarDatos = async () => {
    setLoading(true);
    const [u, r, p, a] = await Promise.all([
      fetch(getApiUrl("/api/usuarios")).then((r) => r.json()),
      fetch(getApiUrl("/api/roles")).then((r) => r.json()),
      fetch(getApiUrl("/api/propiedades")).then((r) => r.json()),
      fetch(getApiUrl("/api/asignaciones")).then((r) => r.json()),
    ]);
    setUsuarios(u);
    setRoles(r);
    setPropiedades(p);
    setAsignaciones(a);
    setLoading(false);
  };

  useEffect(() => { cargarDatos(); }, []);

  const abrirNuevo = () => {
    setForm({ nombre: "", email: "", password: "", id_rol: roles[0]?.id_rol || 1 });
    setModal({ open: true });
  };

  const abrirEditar = (u: Usuario) => {
    setForm({ nombre: u.nombre, email: u.email, password: "", id_rol: u.id_rol });
    setModal({ open: true, edit: u });
  };

  const guardar = async () => {
    setSaving(true);
    const data = new FormData();
    data.append("nombre", form.nombre);
    data.append("email", form.email);
    data.append("id_rol", form.id_rol.toString());
    if (form.password) data.append("password", form.password);

    const url = modal.edit
      ? getApiUrl(`/api/usuarios/${modal.edit.id_usuario}`)
      : getApiUrl("/api/usuarios");
    const method = modal.edit ? "PUT" : "POST";

    try {
      await fetch(url, { method, body: data });
      setModal({ open: false });
      cargarDatos();
    } catch { alert("Error al guardar"); }
    finally { setSaving(false); }
  };

  const eliminar = async (id: number) => {
    if (!confirm("Eliminar este usuario?")) return;
    try {
      await fetch(getApiUrl(`/api/usuarios/${id}`), { method: "DELETE" });
      cargarDatos();
    } catch { alert("Error al eliminar"); }
  };

  const getAsignaciones = (id: number) => asignaciones.filter((a) => a.id_usuario === id);
  const getDisponibles = () => {
    const asignadas = new Set(asignaciones.filter((a) => a.id_usuario === asigModal.usuario?.id_usuario).map((a) => a.id_propiedad));
    return propiedades.filter((p) => !asignadas.has(p.id_propiedad));
  };

  const asignar = async (id_propiedad: string) => {
    if (!asigModal.usuario) return;
    const data = new FormData();
    data.append("id_usuario", asigModal.usuario.id_usuario.toString());
    data.append("id_propiedad", id_propiedad);
    await fetch(getApiUrl("/api/asignaciones"), { method: "POST", body: data });
    const res = await fetch(getApiUrl("/api/asignaciones"));
    setAsignaciones(await res.json());
  };

  const desasignar = async (id_propiedad: string) => {
    if (!asigModal.usuario) return;
    const data = new FormData();
    data.append("id_usuario", asigModal.usuario.id_usuario.toString());
    data.append("id_propiedad", id_propiedad);
    await fetch(getApiUrl("/api/asignaciones"), { method: "DELETE", body: data });
    const res = await fetch(getApiUrl("/api/asignaciones"));
    setAsignaciones(await res.json());
  };

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Gestion de usuarios, roles y asignacion de propiedades."
      />

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Personal</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Usuarios del sistema</h3>
          </div>
          <button onClick={abrirNuevo} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
            <Plus className="h-4 w-4" /> Nuevo usuario
          </button>
        </div>

        {loading ? (
          <div className="mt-6 flex h-40 items-center justify-center text-sm text-slate-400">Cargando...</div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <th className="pb-3 pr-4">Nombre</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Rol</th>
                  <th className="pb-3 pr-4">Propiedades</th>
                  <th className="pb-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id_usuario} className="border-b border-slate-100 last:border-0">
                    <td className="py-4 pr-4 font-medium text-slate-900">{u.nombre}</td>
                    <td className="py-4 pr-4 text-slate-500">{u.email}</td>
                    <td className="py-4 pr-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{u.nombre_rol}</span>
                    </td>
                    <td className="py-4 pr-4">
                      <button
                        onClick={() => { setAsigModal({ open: true, usuario: u }); }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        {getAsignaciones(u.id_usuario).length}
                      </button>
                    </td>
                    <td className="py-4 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => abrirEditar(u)} className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => eliminar(u.id_usuario)} className="rounded-full p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">{modal.edit ? "Editar usuario" : "Nuevo usuario"}</h3>
              <button onClick={() => setModal({ open: false })} className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nombre</label>
                <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900" required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900" required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Contrasena {modal.edit && <span className="font-normal lowercase text-slate-400">(dejar vacio para no cambiar)</span>}
                </label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Rol</label>
                <select value={form.id_rol} onChange={(e) => setForm({ ...form, id_rol: Number(e.target.value) })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900">
                  {roles.map((r) => <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setModal({ open: false })} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50">Cancelar</button>
                <button onClick={guardar} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-400">
                  {saving ? "Guardando..." : modal.edit ? "Actualizar" : "Crear usuario"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {asigModal.open && asigModal.usuario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">
                Propiedades de {asigModal.usuario.nombre}
              </h3>
              <button onClick={() => setAsigModal({ open: false, usuario: null })} className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Asignadas</p>
              <div className="mt-2 space-y-2">
                {getAsignaciones(asigModal.usuario.id_usuario).length === 0 ? (
                  <p className="text-sm text-slate-400">Sin propiedades asignadas</p>
                ) : (
                  getAsignaciones(asigModal.usuario.id_usuario).map((a) => (
                    <div key={a.id_propiedad} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{a.nombre_propiedad}</p>
                        <p className="text-xs text-slate-400">{a.id_propiedad}</p>
                      </div>
                      <button onClick={() => desasignar(a.id_propiedad)} className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Disponibles</p>
              <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                {getDisponibles().length === 0 ? (
                  <p className="text-sm text-slate-400">Todas las propiedades asignadas</p>
                ) : (
                  getDisponibles().map((p) => (
                    <div key={p.id_propiedad} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{p.nombre || p.id_propiedad}</p>
                        <p className="text-xs text-slate-400">{p.id_propiedad}</p>
                      </div>
                      <button onClick={() => asignar(p.id_propiedad)} className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800">
                        Asignar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
