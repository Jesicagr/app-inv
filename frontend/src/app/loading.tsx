export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-lg bg-slate-200" />
          <div className="h-4 w-72 rounded-lg bg-slate-200" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="space-y-3">
              <div className="h-3 w-20 rounded-full bg-slate-200" />
              <div className="h-8 w-16 rounded-lg bg-slate-200" />
              <div className="h-3 w-28 rounded-full bg-slate-200" />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded-full bg-slate-200" />
          <div className="h-6 w-56 rounded-lg bg-slate-200" />
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex items-center gap-3">
                <div className="h-5 w-20 rounded-full bg-slate-200" />
                <div className="h-3 w-10 rounded-full bg-slate-200" />
              </div>
              <div className="mt-3 h-5 w-3/4 rounded-lg bg-slate-200" />
              <div className="mt-2 flex gap-4">
                <div className="h-3 w-32 rounded-full bg-slate-200" />
                <div className="h-3 w-24 rounded-full bg-slate-200" />
                <div className="h-3 w-28 rounded-full bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
