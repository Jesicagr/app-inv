"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FileText, History, Package, Wallet } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import { getApiUrl } from "../../lib/api";

type Consumible = {
  id_servicio: string;
  nombre_producto: string;
  stock_actual: number;
  stock_minimo: number;
};

export default function ConsumiblesPage() {
  const [productos, setProductos] = useState<Consumible[]>([]);

  useEffect(() => {
    fetch(getApiUrl("/api/consumibles"))
      .then((res) => res.json())
      .then((data) => setProductos(data))
      .catch((err) => console.warn("Error al conectar consumibles:", err));
  }, []);

  const summary = useMemo(() => {
    const criticalItems = productos.filter(
      (item) => item.stock_actual <= item.stock_minimo,
    );
    const totalUnits = productos.reduce((acc, item) => acc + item.stock_actual, 0);

    return {
      totalProducts: productos.length,
      criticalItems: criticalItems.length,
      totalUnits,
    };
  }, [productos]);

  return (
    <>
      <PageHeader
        eyebrow="Inventario"
        title="Consumibles"
        description="Este modulo concentra el catalogo operativo, el estado de stock y una vista clara de los productos que merecen seguimiento inmediato."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Productos"
          value={summary.totalProducts.toString()}
          caption="Items registrados en catalogo"
          icon={Package}
        />
        <StatCard
          title="Unidades"
          value={summary.totalUnits.toString()}
          caption="Suma simple del stock actual"
          icon={Wallet}
        />
        <StatCard
          title="Alertas de stock"
          value={summary.criticalItems.toString()}
          caption="Productos iguales o por debajo del minimo"
          icon={AlertTriangle}
          tone={summary.criticalItems > 0 ? "danger" : "success"}
        />
        <StatCard
          title="Catalogo visible"
          value={productos.length ? "Activo" : "Pendiente"}
          caption="El listado se alimenta desde el backend"
          icon={FileText}
          tone="warning"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Catalogo
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              Productos disponibles
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Id</th>
                  <th className="px-6 py-4 font-semibold">Producto</th>
                  <th className="px-6 py-4 font-semibold text-right">Stock</th>
                  <th className="px-6 py-4 font-semibold text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {productos.map((prod) => {
                  const isCritical = prod.stock_actual <= prod.stock_minimo;

                  return (
                    <tr key={prod.id_servicio} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono text-slate-500">
                        {prod.id_servicio}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {prod.nombre_producto}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-700">
                        {prod.stock_actual} ud.
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            isCritical
                              ? "bg-rose-100 text-rose-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isCritical ? "Critico" : "Optimo"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <History className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Historial
              </p>
              <h3 className="mt-1 text-xl font-semibold text-slate-900">
                Movimientos de referencia
              </h3>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Hoy · 10:45
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Salida de stock: Papel toalla
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Movimiento de consumo para operacion diaria.
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Hoy · 09:12
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Ingreso de stock: Cafe en grano
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Reposicion registrada para abastecimiento semanal.
              </p>
            </div>

            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Usa esta columna como tablero rapido para luego conectar movimientos reales del backend.
            </div>
          </div>
        </article>
      </section>
    </>
  );
}
