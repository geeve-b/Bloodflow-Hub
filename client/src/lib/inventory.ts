import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export type InventoryStatus = "available" | "limited" | "not_available";

export const INVENTORY_STALE_THRESHOLD_HOURS = 12;
export const INVENTORY_STALE_THRESHOLD_MS =
  INVENTORY_STALE_THRESHOLD_HOURS * 60 * 60 * 1000;

export const normalizeInventoryStatus = (
  value?: string | null
): InventoryStatus => {
  if (value === "limited" || value === "not_available") {
    return value;
  }
  return "available";
};

export const formatInventoryTimestamp = (value?: string | Date) => {
  if (!value) return "Not updated yet";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Not updated yet";
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const hoursDisplay = hours.toString().padStart(2, "0");
  return `${day}-${month}-${year} | ${hoursDisplay}:${minutes} ${suffix}`;
};

export const isInventoryStale = (value?: string | Date) => {
  if (!value) return true;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return true;
  return Date.now() - date.getTime() > INVENTORY_STALE_THRESHOLD_MS;
};

export const isInventoryUsable = (status?: InventoryStatus) =>
  status !== "not_available";

/**
 * Calculate inventory status based on quantity
 * Less than 1 unit = "not_available" (Unavailable)
 * 1 or more units = "available" (Available)
 */
export const calculateStatusFromQuantity = (quantity: number): InventoryStatus => {
  if (quantity < 1) {
    return "not_available";
  }
  return "available";
};

export const inventoryStatusMeta: Record<
  InventoryStatus,
  {
    label: string;
    badgeClass: string;
    icon: LucideIcon;
    iconClass: string;
    description: string;
  }
> = {
  available: {
    label: "Available",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
    iconClass: "text-emerald-600",
    description: "Sufficient units ready for immediate use",
  },
  limited: {
    label: "Limited",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    icon: AlertTriangle,
    iconClass: "text-amber-600",
    description: "Low stock level, prioritize replenishment",
  },
  not_available: {
    label: "Not Available",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    icon: XCircle,
    iconClass: "text-rose-600",
    description: "Currently unavailable at this facility",
  },
};
