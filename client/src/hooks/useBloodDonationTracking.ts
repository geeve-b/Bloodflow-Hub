import { useQuery } from "@tanstack/react-query";
import type { BloodDonationTracking } from "@shared/schema";

export interface TrackingFilters {
  status?: string;
  bloodType?: string;
}

export function useBloodDonationTracking(donorId?: string, filters?: TrackingFilters) {
  return useQuery({
    queryKey: ["blood-donation-tracking", donorId, filters],
    queryFn: async () => {
      if (!donorId) return [];

      let url = `/api/blood-donation-tracking/donor/${donorId}`;
      const params = new URLSearchParams();

      if (filters?.status) {
        params.append("status", filters.status);
      }
      if (filters?.bloodType) {
        params.append("bloodType", filters.bloodType);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch blood donation tracking");
      }
      return response.json() as Promise<BloodDonationTracking[]>;
    },
    enabled: !!donorId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBloodDonationTrackingById(trackingId?: string) {
  return useQuery({
    queryKey: ["blood-donation-tracking", trackingId],
    queryFn: async () => {
      if (!trackingId) return null;

      const response = await fetch(`/api/blood-donation-tracking/${trackingId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch tracking record");
      }
      return response.json() as Promise<BloodDonationTracking>;
    },
    enabled: !!trackingId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useBloodDonationTrackingByReceiver(receiverId?: string) {
  return useQuery({
    queryKey: ["blood-donation-tracking-receiver", receiverId],
    queryFn: async () => {
      if (!receiverId) return [];

      const response = await fetch(`/api/blood-donation-tracking/receiver/${receiverId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch receiver tracking records");
      }
      return response.json() as Promise<BloodDonationTracking[]>;
    },
    enabled: !!receiverId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useBloodDonationTrackingByHospital(hospitalId?: string) {
  return useQuery({
    queryKey: ["blood-donation-tracking-hospital", hospitalId],
    queryFn: async () => {
      if (!hospitalId) return [];

      const response = await fetch(`/api/blood-donation-tracking/hospital/${hospitalId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch hospital tracking records");
      }
      return response.json() as Promise<BloodDonationTracking[]>;
    },
    enabled: !!hospitalId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
