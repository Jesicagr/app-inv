"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[20px] bg-rose-100">
        <AlertTriangle className="h-8 w-8 text-rose-600" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900">
        Algo salio mal
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Ocurrio un error inesperado. Intenta de nuevo.
      </p>
      <button
        onClick={() => unstable_retry()}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
