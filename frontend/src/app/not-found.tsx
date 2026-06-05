import Link from "next/link";
import { ShieldOff } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[20px] bg-slate-100">
        <ShieldOff className="h-8 w-8 text-slate-500" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900">
        Pagina no encontrada
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        La pagina que buscas no existe o fue movida.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
