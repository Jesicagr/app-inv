'use client';

import { useEffect, useState } from 'react';
import { Package, Wallet, FileText, AlertTriangle, History } from 'lucide-react';

export default function ConsumiblesPage() {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/consumibles')
      .then(res => res.json())
      .then(data => setProductos(data))
      .catch(err => console.warn("Error al conectar consumibles:", err));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Inventario de Consumibles</h2>
        <p className="text-sm text-slate-500">Gestión, validación de gasto y control de stock institucional.</p>
      </div>

      {/* Fila de Kpis Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-800 shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Presupuesto Mensual</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">$12,500.00</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Gasto Validado</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">$4,320.50</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-red-700 font-semibold uppercase tracking-wider">Alertas de Stock</p>
            <p className="text-2xl font-bold text-red-900 mt-1">8 Ítems</p>
          </div>
        </div>
      </div>

      {/* Cuerpo Principal Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabla de Productos */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">Catálogo de Productos</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4 text-right">Stock</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {productos.map((prod: any) => (
                  <tr key={prod.id_servicio} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">{prod.id_servicio}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{prod.nombre_producto}</td>
                    <td className="py-3 px-4 text-right font-medium">{prod.stock_actual} ud.</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${prod.stock_actual <= prod.stock_minimo ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {prod.stock_actual <= prod.stock_minimo ? 'Crítico' : 'Óptimo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Historial Lateral */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <History className="w-5 h-5 text-slate-400" /> Historial de Movimientos
          </h3>
          <div className="relative border-l-2 border-slate-200 ml-2 space-y-4 text-xs">
            <div className="relative pl-4">
              <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-900"></div>
              <p className="text-slate-400">Hoy, 10:45 AM</p>
              <p className="font-semibold text-slate-800 mt-0.5">Salida de Stock: Papel Toalla</p>
            </div>
            <div className="relative pl-4">
              <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-green-600"></div>
              <p className="text-slate-400">Hoy, 09:12 AM</p>
              <p className="font-semibold text-slate-800 mt-0.5">Ingreso de Stock: Café Grano (10 kg)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}