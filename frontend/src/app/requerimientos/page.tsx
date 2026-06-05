"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Clock,
  FileEdit,
  Plus,
  X,
  Camera,
  RefreshCw,
  Send,
  UserCheck,
  Circle,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import { api } from "../../lib/api-client";
import { useAuth } from "../../lib/AuthContext";

type Requerimiento = {
  id_requerimiento: number;
  id_propiedad: string;
  id_usuario_solicitante: number;
  descripcion: string;
  tipo: string;
  id_item: number | null;
  estado: string;
  fecha_solicitud: string;
  fecha_asignacion: string | null;
  fecha_finalizacion: string | null;
  id_usuario_asignado: number | null;
  monto_gastado: number | null;
  id_gasto: number | null;
  url_foto: string | null;
  dictamen: string | null;
  nombre_propiedad: string | null;
  nombre_solicitante: string | null;
  nombre_asignado: string | null;
};

type Propiedad = {
  id_propiedad: string;
  nombre: string;
};

const ESTADOS = ["PENDIENTE", "EN_PROCESO", "COMPLETADO", "RECHAZADO"];

const BADGE: Record<string, { bg: string; text: string }> = {
  PENDIENTE: { bg: "bg-amber-100", text: "text-amber-800" },
  EN_PROCESO: { bg: "bg-sky-100", text: "text-sky-800" },
  COMPLETADO: { bg: "bg-emerald-100", text: "text-emerald-800" },
  RECHAZADO: { bg: "bg-rose-100", text: "text-rose-800" },
};

export default function RequerimientosPage() {
  const { usuario } = useAuth();
  const [items, setItems] = useState<Requerimiento[]>([]);
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id_propiedad: "", descripcion: "", tipo: "GENERAL" });
  const [saving, setSaving] = useState(false);

  const [completarId, setCompletarId] = useState<number | null>(null);
  const [completarMonto, setCompletarMonto] = useState(0);
  const [completarFoto, setCompletarFoto] = useState<File | null>(null);
  const [completando, setCompletando] = useState(false);

  const esLider = usuario?.rol === "LIDER";
  const esPropiedades = usuario?.rol === "PROPIEDADES";
  const esAdmin = usuario?.rol === "ADMIN" || usuario?.rol === "AUDITOR";

  const cargar = async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filtroEstado) params.estado = filtroEstado;
    if (usuario && (esLider || esPropiedades)) params.id_usuario = usuario.id.toString();

    const propParams: Record<string, string> = {};
    if (esPropiedades && usuario) propParams.id_usuario = usuario.id.toString();

    try {
      const [r, p] = await Promise.all([
        api.get<Requerimiento[]>("/api/requerimientos", { params }),
        api.get<Propiedad[]>("/api/propiedades", { params: propParams }),
      ]);
      setItems(Array.isArray(r) ? r : []);
      setPropiedades(Array.isArray(p) ? p : []);
    } catch {
      setItems([]);
      setPropiedades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [filtroEstado, usuario]);

  const crear = async () => {
    if (!usuario) return;
    setSaving(true);
    const data = new FormData();
    data.append("id_propiedad", form.id_propiedad);
    data.append("descripcion", form.descripcion);
    data.append("tipo", form.tipo);
    data.append("id_usuario_solicitante", usuario.id.toString());
    try {
      await api.post("/api/requerimientos", data);
      setShowForm(false);
      setForm({ id_propiedad: "", descripcion: "", tipo: "GENERAL" });
      cargar();
    } catch (e) { alert(e instanceof Error ? e.message : "Error al crear"); }
    finally { setSaving(false); }
  };

  const asignarme = async (id: number) => {
    if (!usuario) return;
    const data = new FormData();
    data.append("id_usuario_asignado", usuario.id.toString());
    try {
      await api.put(`/api/requerimientos/${id}/asignar`, data);
      cargar();
    } catch (e) { alert(e instanceof Error ? e.message : "Error al asignar"); }
  };

  const completar = async () => {
    if (!completarFoto || completarMonto <= 0) return;
    setCompletando(true);
    const data = new FormData();
    data.append("monto", completarMonto.toString());
    data.append("foto", completarFoto);
    try {
      await api.post(`/api/requerimientos/${completarId}/completar`, data);
      setCompletarId(null);
      setCompletarFoto(null);
      setCompletarMonto(0);
      cargar();
    } catch (e) { alert(e instanceof Error ? e.message : "Error al completar"); }
    finally { setCompletando(false); }
  };

  const rechazar = async (id: number) => {
    if (!confirm("Rechazar este requerimiento?")) return;
    try {
      await api.put(`/api/requerimientos/${id}/rechazar`);
      cargar();
    } catch (e) { alert(e instanceof Error ? e.message : "Error"); }
  };

  const list = Array.isArray(items) ? items : [];

  const summary = {
    total: list.length,
    pendientes: list.filter((i) => i.estado === "PENDIENTE").length,
    enProceso: list.filter((i) => i.estado === "EN_PROCESO").length,
    alertas: list.filter((i) => i.dictamen === "BAJO_INVESTIGACION" || i.dictamen === "RECHAZADO").length,
  };

  return (
    <>
      <PageHeader
        title="Requerimientos"
        description="Solicitudes de LIDER, ejecucion de PROPIEDADES y auditoria automatica SIAR."
        actions={
          <div className="flex gap-2">
            <select
              className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-colors hover:border-slate-300"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            {esLider && (
              <button onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
                <Plus className="h-4 w-4" /> Nuevo
              </button>
            )}
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total" value={summary.total.toString()} caption="Requerimientos" icon={FileEdit} />
        <StatCard title="Pendientes" value={summary.pendientes.toString()} caption="Sin asignar" icon={Clock} tone={summary.pendientes > 0 ? "warning" : "success"} />
        <StatCard title="En proceso" value={summary.enProceso.toString()} caption="Asignados" icon={UserCheck} tone="success" />
        <StatCard title="Alertas SIAR" value={summary.alertas.toString()} caption="Dictamen no aprobado" icon={AlertTriangle} tone={summary.alertas > 0 ? "danger" : "success"} />
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Solicitudes</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Lista de requerimientos</h3>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 flex h-40 items-center justify-center text-sm text-slate-400">Cargando...</div>
        ) : list.length === 0 ? (
          <div className="mt-6 flex h-40 items-center justify-center text-sm text-slate-400">Sin requerimientos</div>
        ) : (
          <div className="mt-6 space-y-3">
            {list.map((r) => {
              const badge = BADGE[r.estado] || BADGE.PENDIENTE;
              const tone = r.dictamen === "APROBADO" ? "text-emerald-600" :
                r.dictamen === "BAJO_INVESTIGACION" ? "text-amber-600" :
                r.dictamen === "RECHAZADO" ? "text-rose-600" : "text-slate-400";

              return (
                <div key={r.id_requerimiento}
                  className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition-colors hover:bg-white">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.bg} ${badge.text}`}>
                          {r.estado}
                        </span>
                        <span className="text-xs font-medium text-slate-400">#{r.id_requerimiento}</span>
                        {r.dictamen && (
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${tone}`}>
                            <Circle className="h-2 w-2 fill-current" />
                            {r.dictamen}
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-base font-semibold text-slate-900">{r.descripcion}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span>Propiedad: <strong>{r.nombre_propiedad || r.id_propiedad}</strong></span>
                        <span>Tipo: <strong>{r.tipo}</strong></span>
                        <span>Solicitante: <strong>{r.nombre_solicitante || "—"}</strong></span>
                        {r.nombre_asignado && <span>Asignado: <strong>{r.nombre_asignado}</strong></span>}
                        <span>Fecha: <strong>{r.fecha_solicitud}</strong></span>
                        {r.monto_gastado != null && <span>Monto: <strong>${r.monto_gastado}</strong></span>}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      {r.estado === "PENDIENTE" && esPropiedades && (
                        <button onClick={() => asignarme(r.id_requerimiento)}
                          className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700">
                          <UserCheck className="h-4 w-4" /> Asignarme
                        </button>
                      )}
                      {r.estado === "EN_PROCESO" && esPropiedades && r.id_usuario_asignado === usuario?.id && (
                        <button onClick={() => { setCompletarId(r.id_requerimiento); setCompletarMonto(0); setCompletarFoto(null); }}
                          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700">
                          <Send className="h-4 w-4" /> Completar
                        </button>
                      )}
                      {(esAdmin || esLider) && r.estado === "PENDIENTE" && (
                        <button onClick={() => rechazar(r.id_requerimiento)}
                          className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50">
                          <X className="h-4 w-4" /> Rechazar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Nuevo requerimiento</h3>
              <button onClick={() => setShowForm(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Propiedad</label>
                <select value={form.id_propiedad} onChange={(e) => setForm({ ...form, id_propiedad: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900" required>
                  <option value="">Seleccionar</option>
                  {propiedades.map((p) => <option key={p.id_propiedad} value={p.id_propiedad}>{p.nombre || p.id_propiedad}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Descripcion</label>
                <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900" rows={3}
                  placeholder="Ej. Faltan bombillas en el salon principal" required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tipo</label>
                <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900">
                  <option value="GENERAL">General</option>
                  <option value="ACTIVO">Activo fijo</option>
                  <option value="CONSUMIBLE">Consumible</option>
                  <option value="SERVICIO">Servicio</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)}
                  className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50">Cancelar</button>
                <button onClick={crear} disabled={saving || !form.id_propiedad || !form.descripcion}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-400">
                  {saving ? "Guardando..." : "Crear solicitud"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {completarId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Completar requerimiento</h3>
              <button onClick={() => setCompletarId(null)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-4 text-sm text-slate-500">Ingresa el monto gastado y la foto de evidencia. El sistema ejecutara la auditoria SIAR automaticamente.</p>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Monto gastado ($)</label>
                <input type="number" step="0.01" min="0" value={completarMonto} onChange={(e) => setCompletarMonto(Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900" required />
              </div>
              <label className="relative block cursor-pointer rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center transition-colors hover:bg-white">
                <input type="file" accept="image/*" capture="environment"
                  className="absolute inset-0 opacity-0"
                  onChange={(e) => setCompletarFoto(e.target.files?.[0] || null)} />
                <Camera className="mx-auto h-8 w-8 text-slate-400" />
                <span className="mt-2 block text-sm font-medium text-slate-600">
                  {completarFoto ? completarFoto.name : "Tomar foto de evidencia"}
                </span>
                <span className="mt-1 block text-xs text-slate-400">Preserva metadatos GPS para auditoria</span>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setCompletarId(null)}
                  className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600">Cancelar</button>
                <button onClick={completar} disabled={completando || !completarFoto || completarMonto <= 0}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-400">
                  {completando ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {completando ? "Auditando..." : "Completar y auditar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
