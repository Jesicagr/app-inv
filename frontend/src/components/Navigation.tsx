import Link from 'next/link';
import { LayoutDashboard, Package, ShieldCheck, Settings } from 'lucide-react';

export default function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-400 border-t border-slate-800 flex justify-around py-3 z-50 md:top-0 md:bottom-auto md:flex-col md:w-64 md:h-full md:justify-start md:gap-6 md:p-6">
      <div className="hidden md:block text-white font-bold text-xl mb-6">AssetSteward</div>
      <Link href="/" className="flex flex-col md:flex-row items-center gap-2 hover:text-white">
        <LayoutDashboard className="w-6 h-6" />
        <span className="text-xs md:text-sm">Panel</span>
      </Link>
      <Link href="/consumibles" className="flex flex-col md:flex-row items-center gap-2 hover:text-white">
        <Package className="w-6 h-6" />
        <span className="text-xs md:text-sm">Consumibles</span>
      </Link>
      <Link href="/auditoria" className="flex flex-col md:flex-row items-center gap-2 hover:text-white">
        <ShieldCheck className="w-6 h-6" />
        <span className="text-xs md:text-sm">Auditoría</span>
      </Link>
    </nav>
  );
}