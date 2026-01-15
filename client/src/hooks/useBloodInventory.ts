import { useQuery } from "@tanstack/react-query";
import {
  InventoryStatus,
  normalizeInventoryStatus,
} from "@/lib/inventory";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

interface RawBloodInventory {
  _id?: string;
  id?: string;
  hospitalId?: string;
  hospitalName?: string;
  bloodType?: string;
  quantity?: number;
  status?: string;
  expiryDate?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface BloodInventoryRecord {
  _id: string;
  hospitalId: string;
  hospitalName: string;
  bloodType: string;
  quantity: number;
  status: InventoryStatus;
  expiryDate?: string;
  updatedAt?: string;
  createdAt?: string;
}

const fetchBloodInventory = async (): Promise<BloodInventoryRecord[]> => {
  const response = await fetch(`${API_URL}/blood-inventory`);
  if (!response.ok) {
    throw new Error("Failed to load blood inventory");
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((entry: RawBloodInventory): BloodInventoryRecord => {
    const fallbackId =
      entry._id ??
      entry.id ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2));
    return {
      _id: fallbackId,
      hospitalId: entry.hospitalId ?? "unknown-hospital",
      hospitalName: entry.hospitalName ?? "Unknown Hospital",
      bloodType: entry.bloodType ?? "O+",
      quantity: Number.isFinite(entry.quantity) ? Number(entry.quantity) : 0,
      status: normalizeInventoryStatus(entry.status),
      expiryDate: entry.expiryDate,
      updatedAt: entry.updatedAt ?? entry.createdAt,
      createdAt: entry.createdAt,
    };
  });
};

export function useBloodInventory() {
  return useQuery<BloodInventoryRecord[], Error>({
    queryKey: ["blood-inventory"],
    queryFn: fetchBloodInventory,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
