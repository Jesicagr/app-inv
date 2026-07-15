"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { QRCodeCanvas } from "qrcode.react";
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
  CheckCircle,
  ShieldAlert,
  QrCode,
} from "lucide-react";
import PageHeader from "../../../components/ui/PageHeader";
import StatCard from "../../../components/ui/StatCard";
import Pagination from "../../../components/ui/Pagination";
import { getApiUrl } from "../../../lib/api";
import { useAuth } from "../../../lib/AuthContext";

const MapaActivos = dynamic(() => import("../../../components/MapaActivos"), { ssr: false, loading: () => null });

type ActivoFijo = {
  id_activo: number;
  id_propiedad: string;
  nombre: string;
  descripcion: string;
  estado: string;
  codigo_inventario: string;
  codigo_activo: string;
  url_foto: string;
};

type Propiedad = {
  id_propiedad: string;
  nombre: string;
};

type DashboardMetrics = {
  total_activos: number;
  alertas_criticas: number;
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
  const [metrics, setMetrics] = useState<DashboardMetrics>({ total_activos: 0, alertas_criticas: 0 });
  const [modal, setModal] = useState<{ open: boolean; edit?: ActivoFijo }>({ open: false });
  const [form, setForm] = useState({ id_propiedad: "", nombre: "", descripcion: "", estado: "BUENO", codigo_inventario: "", url_foto: "", codigo_activo: "" });
  const [saving, setSaving] = useState(false);
  const [reportando, setReportando] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroProp, setFiltroProp] = useState("");
  const [mapaVisible, setMapaVisible] = useState(false);
  const [qrActivo, setQrActivo] = useState<ActivoFijo | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const esPropiedades = usuario?.rol === "PROPIEDADES";

  const cargar = useCallback((p: number = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", p.toString());
    params.set("per_page", "200");
    if (esPropiedades && usuario) params.set("id_usuario", usuario.id.toString());
    if (filtroProp) params.set("id_propiedad", filtroProp);
    const url = `/api/activos?${params.toString()}`;
    const propUrl = esPropiedades && usuario ? `/api/propiedades?id_usuario=${usuario.id}` : "/api/propiedades";
    Promise.all([
      fetch(getApiUrl(url)).then((r) => r.json()),
      fetch(getApiUrl(propUrl)).then((r) => r.json()),
      fetch(getApiUrl("/api/dashboard")).then((r) => r.json()),
    ]).then(([a, pr, d]) => {
      const pag = a.data ? a : { data: a, total: a.length, page: 1, pages: 1 };
      setActivos(pag.data);
      setPage(pag.page);
      setPages(pag.pages);
      setTotal(pag.total);
      setPropiedades(pr);
      setMetrics(d);
    }).catch(() => setActivos([])).finally(() => setLoading(false));
  }, [esPropiedades, usuario, filtroProp]);

  useEffect(() => { cargar(page); }, [usuario, page, filtroProp]);

  const reportarActivo = async (id: number) => {
    setReportando(id);
    try {
      const res = await fetch(getApiUrl(`/api/activos/${id}/reportar`), { method: "POST" });
      if (!res.ok) throw new Error();
      cargar();
    } catch { alert("Error"); } finally { setReportando(null); }
  };

  const abrirNuevo = () => {
    setForm({ id_propiedad: propiedades[0]?.id_propiedad || "", nombre: "", descripcion: "", estado: "BUENO", codigo_inventario: "", url_foto: "", codigo_activo: "" });
    setModal({ open: true });
  };

  const abrirEditar = (a: ActivoFijo) => {
    setForm({ id_propiedad: a.id_propiedad, nombre: a.nombre, descripcion: a.descripcion, estado: a.estado, codigo_inventario: a.codigo_inventario, url_foto: a.url_foto, codigo_activo: a.codigo_activo });
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

  const totalValidados = activos.filter((a) => a.estado === "EXCELENTE" || a.estado === "BUENO").length;
  const pctValidados = activos.length > 0 ? Math.round((totalValidados / activos.length) * 100) : 0;

  return (
    <>
      <PageHeader
        eyebrow="Inventario físico"
        title="Activos fijos"
        description="Inventario físico de bienes durables por propiedad. Monitoreo de estado, validación GPS y reporte de novedades."
        actions={
          <div className="flex gap-2">
            <select className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-colors hover:border-slate-300"
              value={filtroProp} onChange={(e) => setFiltroProp(e.target.value)}>
              <option value="">Todas las capillas</option>
              {propiedades.map((p) => <option key={p.id_propiedad} value={p.id_propiedad}>{p.nombre || p.id_propiedad}</option>)}
            </select>
            <select className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-colors hover:border-slate-300"
              value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="">Estado: Todos</option>
              {ESTADOS.map((e) => <option key={e} value={e}>{e.replace("_", " ")}</option>)}
            </select>
            <button onClick={abrirNuevo} className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
              <Plus className="h-4 w-4" /> Nuevo activo
            </button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total auditado"
          value={metrics.total_activos.toString()}
          caption="Activos consolidados en dashboard"
          icon={CheckCircle}
          tone="success"
        />
        <StatCard
          title="Alertas GPS"
          value={metrics.alertas_criticas.toString()}
          caption="Casos con desvío geográfico"
          icon={ShieldAlert}
          tone={metrics.alertas_criticas > 0 ? "danger" : "success"}
        />
        <StatCard
          title="Cobertura"
          value={`${pctValidados}%`}
          caption="Activos en estado óptimo sobre el total"
          icon={MapPin}
        />
      </section>

      {totalMalo > 0 && (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-rose-800">
            <AlertTriangle className="h-4 w-4" />
            {totalMalo} activo{totalMalo > 1 ? "s" : ""} requiere{totalMalo <= 1 ? "" : "n"} atención inmediata
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <button onClick={() => setMapaVisible(!mapaVisible)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
          <Map className="h-4 w-4" />
          {mapaVisible ? "Ocultar mapa" : "Ver mapa de propiedades"}
        </button>
        <span className="text-sm text-slate-500">
          {total} activo{total !== 1 ? "s" : ""} registrado{total !== 1 ? "s" : ""}
        </span>
      </div>

      {mapaVisible && (
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <MapaActivos />
        </section>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-slate-400">Cargando activos...</div>
      ) : filtrados.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-[28px] border border-slate-200 bg-white text-sm text-slate-400">Sin activos registrados</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((a) => {
            const tone = a.estado === "OBSOLETO" ? "danger" : a.estado === "REQUIERE_REPARACION" ? "warning" : "success";
            return (
              <div key={a.id_activo} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{a.nombre}</p>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          tone === "success" ? "bg-emerald-100 text-emerald-700" :
                          tone === "warning" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                        }`}>{a.estado.replace("_", " ")}</span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-slate-400">{a.codigo_activo}</p>
                      {a.descripcion && <p className="mt-1 text-sm leading-5 text-slate-500 line-clamp-2">{a.descripcion}</p>}
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-sky-600" />
                        <span>{getPropName(a.id_propiedad)}</span>
                        {a.codigo_inventario && <span className="ml-auto font-mono text-[11px] text-slate-400">{a.codigo_inventario}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex gap-1">
                      {a.estado !== "REQUIERE_REPARACION" && a.estado !== "OBSOLETO" && (
                        <button onClick={() => reportarActivo(a.id_activo)} disabled={reportando === a.id_activo}
                          className="rounded-xl bg-amber-50 p-2 text-amber-600 transition-colors hover:bg-amber-100" title="Reportar daño">
                          <Wrench className={`h-4 w-4 ${reportando === a.id_activo ? "animate-spin" : ""}`} />
                        </button>
                      )}
                      <button onClick={() => setQrActivo(a)} className="rounded-xl bg-slate-50 p-2 text-slate-400 transition-colors hover:bg-slate-100" title="Ver QR">
                        <QrCode className="h-4 w-4" />
                      </button>
                      <button onClick={() => abrirEditar(a)} className="rounded-xl bg-slate-50 p-2 text-slate-400 transition-colors hover:bg-slate-100">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => eliminar(a.id_activo)} className="rounded-xl bg-slate-50 p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <Boxes className="h-4 w-4 text-slate-300" />
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
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {modal.edit ? "Editar activo" : "Nuevo activo"}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">
                  {modal.edit ? "Actualizar datos del activo" : "Registrar nuevo bien durable"}
                </h3>
              </div>
              <button onClick={() => setModal({ open: false })} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <select value={form.id_propiedad} onChange={(e) => setForm({ ...form, id_propiedad: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900" required>
                <option value="">Seleccionar propiedad</option>
                {propiedades.map((p) => <option key={p.id_propiedad} value={p.id_propiedad}>{p.nombre || p.id_propiedad}</option>)}
              </select>
              <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900" placeholder="Nombre del activo" required />
              <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900" rows={2} placeholder="Descripción (opcional)" />
              {modal.edit && form.codigo_activo && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Código: <span className="font-mono font-medium text-slate-800">{form.codigo_activo}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900">
                  {ESTADOS.map((e) => <option key={e} value={e}>{e.replace("_", " ")}</option>)}
                </select>
                <input type="text" value={form.codigo_inventario} onChange={(e) => setForm({ ...form, codigo_inventario: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900" placeholder="Código inventario (opcional)" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setModal({ open: false })} className="rounded-full border border-slate-200 px-6 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">Cancelar</button>
                <button onClick={guardar} disabled={saving}
                  className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-400">
                  {saving ? "Guardando..." : modal.edit ? "Actualizar activo" : "Crear activo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {qrActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setQrActivo(null)}>
          <div className="w-full max-w-xs rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Código QR</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{qrActivo.nombre}</h3>
              </div>
              <button onClick={() => setQrActivo(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div ref={qrRef} className="flex flex-col items-center gap-3">
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <QRCodeCanvas
                  id="qr-canvas"
                  value={`${window.location.origin}/activos?q=${qrActivo.codigo_activo}`}
                  size={200}
                />
              </div>
              <p className="text-xs text-slate-400">{qrActivo.codigo_activo || "—"}</p>
            </div>
            <button
              onClick={() => {
                const codigo = qrActivo.codigo_activo || "SIN-CODIGO";
                const nombre = qrActivo.nombre || "Activo";
                const qrCanvas = document.getElementById("qr-canvas") as HTMLCanvasElement | null;
                if (!qrCanvas) return;
                const size = 200;
                const padding = 40;
                const lineH = 22;
                const labelH = 40;
                const textStart = padding + size + 16;
                const totalH = textStart + labelH + padding;
                const out = document.createElement("canvas");
                out.width = size + padding * 2;
                out.height = totalH;
                const ctx = out.getContext("2d")!;
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, out.width, out.height);
                ctx.drawImage(qrCanvas, padding, padding, size, size);
                ctx.fillStyle = "#0f172a";
                ctx.font = "bold 16px Inter, system-ui, sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(nombre, out.width / 2, textStart + 14);
                ctx.fillStyle = "#64748b";
                ctx.font = "13px Inter, system-ui, sans-serif";
                ctx.fillText(codigo, out.width / 2, textStart + 14 + lineH);
                const url = out.toDataURL("image/png");
                const a = document.createElement("a");
                a.href = url;
                a.download = `${nombre} - ${codigo}.png`;
                a.click();
              }}
              className="mt-4 w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Descargar QR
            </button>
          </div>
        </div>
      )}
    </>
  );
}
