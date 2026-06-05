import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  caption: string;
  icon: LucideIcon;
  tone?: "default" | "danger" | "success" | "warning";
};

const toneClasses = {
  default: {
    card: "border-slate-200 bg-white",
    icon: "bg-slate-900 text-white",
    caption: "text-slate-500",
  },
  danger: {
    card: "border-rose-200 bg-rose-50",
    icon: "bg-rose-600 text-white",
    caption: "text-rose-700",
  },
  success: {
    card: "border-emerald-200 bg-emerald-50",
    icon: "bg-emerald-600 text-white",
    caption: "text-emerald-700",
  },
  warning: {
    card: "border-amber-200 bg-amber-50",
    icon: "bg-amber-500 text-white",
    caption: "text-amber-800",
  },
};

export default function StatCard({
  title,
  value,
  caption,
  icon: Icon,
  tone = "default",
}: StatCardProps) {
  const styles = toneClasses[tone];

  return (
    <article className={`rounded-[24px] border p-5 shadow-sm ${styles.card}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {title}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
          <p className={`mt-2 text-sm ${styles.caption}`}>{caption}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${styles.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}
