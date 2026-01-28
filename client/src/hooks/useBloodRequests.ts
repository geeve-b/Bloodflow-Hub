import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeToBloodRequestStream,
  type BloodRequestRealtimeEvent,
  type ConnectionState,
} from "@/lib/realtime";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

interface RawBloodRequest {
  _id?: string;
  id?: string;
  requesterId?: string;
  requesterName?: string;
  hospitalName?: string;
  bloodType?: string;
  quantity?: number;
  urgency?: string;
  patientName?: string;
  contactNumber?: string;
  status?: string;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type BloodRequestStatus = "pending" | "approved" | "fulfilled" | "rejected";
export type BloodRequestUrgency = "critical" | "normal";

export interface BloodRequestRecord {
  _id: string;
  requesterId: string;
  requesterName: string;
  hospitalName: string;
  bloodType: string;
  quantity: number;
  urgency: BloodRequestUrgency;
  patientName: string;
  contactNumber: string;
  status: BloodRequestStatus;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const coerceStatus = (value?: string): BloodRequestStatus => {
  if (value === "approved" || value === "fulfilled" || value === "rejected") {
    return value;
  }
  return "pending";
};

const coerceUrgency = (value?: string): BloodRequestUrgency => {
  return value === "critical" ? "critical" : "normal";
};

const mapToRecord = (entry: RawBloodRequest): BloodRequestRecord => {
  const fallbackId =
    entry._id ??
    entry.id ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2));

  return {
    _id: fallbackId,
    requesterId: entry.requesterId ?? "unknown-requester",
    requesterName: entry.requesterName ?? "Unknown Requester",
    hospitalName: entry.hospitalName ?? "Unknown Hospital",
    bloodType: entry.bloodType ?? "O+",
    quantity: Number.isFinite(entry.quantity) ? Number(entry.quantity) : 0,
    urgency: coerceUrgency(entry.urgency),
    patientName: entry.patientName ?? "Unknown Patient",
    contactNumber: entry.contactNumber ?? "N/A",
    status: coerceStatus(entry.status),
    rejectionReason: entry.rejectionReason ?? null,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
};

const upsertRequest = (
  items: BloodRequestRecord[],
  incoming: BloodRequestRecord,
): BloodRequestRecord[] => {
  const index = items.findIndex((item) => item._id === incoming._id);
  if (index === -1) {
    return [incoming, ...items];
  }
  const next = items.slice();
  next[index] = incoming;
  return next;
};

const applyRealtimeEvent = (
  current: BloodRequestRecord[] | undefined,
  event: BloodRequestRealtimeEvent,
): BloodRequestRecord[] => {
  const baseline = Array.isArray(current) ? current : [];

  if (event.type === "blood-request:deleted") {
    return baseline.filter((item) => item._id !== event.payload.id);
  }

  const normalized = mapToRecord(event.payload as RawBloodRequest);
  return upsertRequest(baseline, normalized).sort((a, b) => {
    const left = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
    const right = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
    return right - left;
  });
};

const fetchBloodRequests = async (): Promise<BloodRequestRecord[]> => {
  const response = await fetch(`${API_URL}/blood-requests`);
  if (!response.ok) {
    throw new Error("Failed to load blood requests");
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((entry: RawBloodRequest) => mapToRecord(entry));
};

export function useBloodRequests() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const queryResult = useQuery<BloodRequestRecord[], Error>({
    queryKey: ["blood-requests"],
    queryFn: fetchBloodRequests,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });

  useEffect(() => {
    const unsubscribe = subscribeToBloodRequestStream({
      auth: user ? { userId: user.id, role: user.role } : undefined,
      onEvent: (event) => {
        queryClient.setQueryData<BloodRequestRecord[]>(
          ["blood-requests"],
          (current) => applyRealtimeEvent(current, event),
        );
      },
      onStateChange: (state: ConnectionState) => {
        if (state === "connected" || state === "fallback-tick") {
          queryClient.invalidateQueries({ queryKey: ["blood-requests"] });
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, user?.id, user?.role]);

  return queryResult;
}
