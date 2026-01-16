import { useQuery } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

interface RawSuggestionResponse {
  requestId?: string;
  suggestions?: RawDonorSuggestion[];
}

interface RawDonorSuggestion {
  donorId?: string;
  donorName?: string;
  bloodType?: string;
  score?: number;
  distanceKm?: number;
  availabilityWindows?: Array<{ start?: string; end?: string }>;
  eligibilityStatus?: string;
  lastDonationDate?: string;
  rationale?: string[];
}

export interface DonorSuggestion {
  donorId: string;
  donorName: string;
  bloodType: string;
  score: number;
  distanceKm?: number;
  availabilityWindows: Array<{ start: string; end: string }>;
  eligibilityStatus?: string;
  lastDonationDate?: string;
  rationale: string[];
}

const normalizeSuggestion = (entry: RawDonorSuggestion): DonorSuggestion => {
  const donorId = entry.donorId || crypto.randomUUID();
  const donorName = entry.donorName || "Unnamed Donor";
  const bloodType = entry.bloodType || "O+";
  const score = Number.isFinite(entry.score) ? Number(entry.score) : 0;

  return {
    donorId,
    donorName,
    bloodType,
    score,
    distanceKm: Number.isFinite(entry.distanceKm)
      ? Number(entry.distanceKm)
      : undefined,
    availabilityWindows: Array.isArray(entry.availabilityWindows)
      ? entry.availabilityWindows
          .filter((window) => window && window.start && window.end)
          .map((window) => ({
            start: window.start as string,
            end: window.end as string,
          }))
      : [],
    eligibilityStatus: entry.eligibilityStatus,
    lastDonationDate: entry.lastDonationDate,
    rationale: Array.isArray(entry.rationale)
      ? entry.rationale.filter((item): item is string => typeof item === "string")
      : [],
  };
};

async function fetchDonorSuggestions(
  requestId: string,
  limit: number
): Promise<DonorSuggestion[]> {
  const url = new URL(
    `${API_URL}/matchmaking/requests/${encodeURIComponent(requestId)}/suggestions`
  );
  url.searchParams.set("limit", limit.toString());

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Unable to load donor suggestions");
  }

  const payload: RawSuggestionResponse = await response.json();
  if (!payload || !Array.isArray(payload.suggestions)) {
    return [];
  }

  return payload.suggestions.map(normalizeSuggestion);
}

export function useDonorSuggestions(
  requestId: string | undefined,
  limit = 5
) {
  return useQuery<DonorSuggestion[], Error>({
    queryKey: ["donor-suggestions", requestId, limit],
    queryFn: () => {
      if (!requestId) {
        return Promise.resolve([]);
      }
      return fetchDonorSuggestions(requestId, limit);
    },
    enabled: Boolean(requestId),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}
