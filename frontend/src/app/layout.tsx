import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "../components/Navigation";
import { Search, Bell, Settings } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AssetSteward - Institutional Management",
  description: "Control de inventario y auditoría geográfica",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-[#f7f9fb] text-slate-900 min-h-screen flex flex-col md:flex-row`}>
        {/* Menú de Navegación Lateral */}
        <Navigation />

        {/* Contenedor Principal Derecha */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden md:pl-64">
          
          {/* TopNavBar Corporativa */}
          <header className="flex justify-between items-center px-8 py-4 w-full bg-white border-b border-slate-200 shadow-sm shrink-0 z-10">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-full border border-slate-200 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 text-sm transition-colors placeholder:text-slate-400" 
                  placeholder="Buscar activos, reportes, ubicaciones..." 
                  type="text" 
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-slate-500">
              <button className="p-2 rounded-full hover:bg-slate-50 transition-colors relative">
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full"></span>
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full hover:bg-slate-50 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div className="h-6 w-px bg-slate-200 mx-2"></div>
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-200 cursor-pointer">
                <div className="w-full h-full bg-gradient-to-tr from-blue-900 to-indigo-700 flex items-center justify-center text-white font-bold text-xs">
                  ADM
                </div>
              </div>
            </div>
          </header>

          {/* Área de Lienzo / Canvas Desplazable */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-[1440px] mx-auto">
              {children}
            </div>
          </main>

        </div>
      </body>
    </html>
  );
}