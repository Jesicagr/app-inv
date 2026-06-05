"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginacionProps = {
  page: number;
  pages: number;
  total: number;
  perPage: number;
  onChange: (page: number) => void;
};

export default function Pagination({ page, pages, total, perPage, onChange }: PaginacionProps) {
  if (pages <= 1) return null;

  const desde = (page - 1) * perPage + 1;
  const hasta = Math.min(page * perPage, total);

  return (
    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
      <p className="text-xs text-slate-400">
        {desde}–{hasta} de {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1)
          .map((p, idx, arr) => (
            <span key={p} className="inline-flex items-center">
              {idx > 0 && arr[idx - 1] !== p - 1 && (
                <span className="px-1 text-xs text-slate-300">...</span>
              )}
              <button
                onClick={() => onChange(p)}
                className={`min-w-[32px] rounded-full px-2 py-1 text-xs font-semibold transition-colors ${
                  p === page
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                {p}
              </button>
            </span>
          ))}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
