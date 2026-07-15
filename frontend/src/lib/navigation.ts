import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  ChartColumnBig,
  ClipboardCheck,
  LayoutDashboard,
  Package,
  Users,
  FileEdit,
  Building2,
  DollarSign,
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
    href: "/dashboard",
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
    href: "/propiedades",
    label: "Propiedades",
    shortLabel: "Props.",
    description: "Capillas, centros y ubicaciones",
    icon: Building2,
  },
  {
    href: "/requerimientos",
    label: "Requerimientos",
    shortLabel: "Req.",
    description: "Solicitudes, asignacion y cierre con auditoria",
    icon: FileEdit,
  },
  {
    href: "/catalogo",
    label: "Catálogo",
    shortLabel: "Cat.",
    description: "Precios de referencia para auditoría",
    icon: DollarSign,
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
  {
    href: "/usuarios",
    label: "Usuarios",
    shortLabel: "Usuarios",
    description: "Gestion de usuarios, roles y asignaciones",
    icon: Users,
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
