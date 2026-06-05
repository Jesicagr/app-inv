import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  ChartColumnBig,
  ClipboardCheck,
  LayoutDashboard,
  Package,
} from "lucide-react";

export type NavigationItem = {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
};

export const navigationItems: NavigationItem[] = [
  {
    href: "/",
    label: "Dashboard",
    shortLabel: "Panel",
    description: "Metricas generales y alertas de supervision",
    icon: LayoutDashboard,
  },
  {
    href: "/consumibles",
    label: "Consumibles",
    shortLabel: "Consumibles",
    description: "Stock, gasto validado y movimientos",
    icon: Package,
  },
  {
    href: "/activos",
    label: "Activos Fijos",
    shortLabel: "Activos",
    description: "Inventario fisico, validacion GPS y mapa",
    icon: Boxes,
  },
  {
    href: "/auditoria",
    label: "Auditoria",
    shortLabel: "Auditoria",
    description: "Registro tecnico y dictamen de inspecciones",
    icon: ClipboardCheck,
  },
  {
    href: "/reportes",
    label: "Reportes",
    shortLabel: "Reportes",
    description: "Resumen ejecutivo y focos de seguimiento",
    icon: ChartColumnBig,
  },
];

export function getCurrentNavigationItem(pathname: string) {
  return (
    navigationItems.find((item) =>
      item.href === "/"
        ? pathname === "/"
        : pathname === item.href || pathname.startsWith(`${item.href}/`),
    ) ?? navigationItems[0]
  );
}
