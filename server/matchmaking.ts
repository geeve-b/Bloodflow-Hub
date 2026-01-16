import { differenceInDays } from "date-fns";
import { type BloodRequest, type Donor } from "@shared/schema";
import type { IStorage } from "./storage";

interface MatchmakingWeights {
  urgencyFit: number;
  inventoryGap: number;
  proximity: number;
  donorRecency: number;
  availability: number;
}

export interface DonorMatch {
  donor: Donor;
  score: number;
  rationale: string[];
  distanceKm?: number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const BLOOD_COMPATIBILITY: Record<string, string[]> = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

const DEFAULT_WEIGHTS: MatchmakingWeights = {
  urgencyFit: 0.4,
  inventoryGap: 0.25,
  proximity: 0.2,
  donorRecency: 0.1,
  availability: 0.05,
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function normalizeScore(value: number, min: number, max: number): number {
  if (max <= min) {
    return 0;
  }
  const clamped = Math.max(min, Math.min(value, max));
  return (clamped - min) / (max - min);
}

export class MatchmakingEngine {
  private cache = new Map<string, CacheEntry<DonorMatch[]>>();
  private cacheTtlMs: number;
  private maxDistanceKm: number;
  private weights: MatchmakingWeights;

  constructor(
    private readonly storage: IStorage,
    options?: {
      cacheTtlMs?: number;
      maxDistanceKm?: number;
      weights?: Partial<MatchmakingWeights>;
    }
  ) {
    this.cacheTtlMs = options?.cacheTtlMs ?? 5 * 60 * 1000;
    this.maxDistanceKm = options?.maxDistanceKm ?? 100;
    this.weights = { ...DEFAULT_WEIGHTS, ...options?.weights };
  }

  async suggestDonors(requestId: string, limit = 5): Promise<DonorMatch[]> {
    const cacheKey = `${requestId}:${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const request = await this.storage.getBloodRequest(requestId);
    if (!request) {
      throw new Error(`Blood request ${requestId} not found`);
    }

    const compatibleDonors = await this.getEligibleDonorsForRequest(request);
    if (!compatibleDonors.length) {
      this.cache.delete(cacheKey);
      return [];
    }

    const inventory = await this.storage.getBloodInventoryByType(
      request.bloodType
    );
    const availableUnits = inventory.reduce(
      (sum, item) => sum + (item.quantity ?? 0),
      0
    );

    const matches = compatibleDonors
      .map((donor) => this.scoreDonor(donor, request, availableUnits))
      .filter((match): match is DonorMatch => match.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    this.cache.set(cacheKey, {
      value: matches,
      expiresAt: Date.now() + this.cacheTtlMs,
    });

    return matches;
  }

  clearCache(): void {
    this.cache.clear();
  }

  private async getEligibleDonorsForRequest(
    request: BloodRequest
  ): Promise<Donor[]> {
    const donors = await this.storage.getAllDonors();
    const compatibleTypes = BLOOD_COMPATIBILITY[request.bloodType] ?? [];

    const today = new Date();
    return donors.filter((donor) => {
      if (!donor.isActive) {
        return false;
      }
      if (donor.eligibilityStatus && donor.eligibilityStatus !== "eligible") {
        if (donor.eligibilityStatus === "temporarily_ineligible") {
          if (donor.deferralUntil && donor.deferralUntil > today) {
            return false;
          }
        } else {
          return false;
        }
      }

      if (!compatibleTypes.includes(donor.bloodType)) {
        return false;
      }

      if (donor.lastDonationDate) {
        const daysSinceDonation = differenceInDays(today, donor.lastDonationDate);
        if (daysSinceDonation < 56) {
          return false;
        }
      }

      if (
        donor.latitude !== undefined &&
        donor.longitude !== undefined &&
        request.hospitalLatitude !== undefined &&
        request.hospitalLongitude !== undefined
      ) {
        const distance = haversineDistance(
          donor.latitude,
          donor.longitude,
          request.hospitalLatitude,
          request.hospitalLongitude
        );
        if (distance > this.maxDistanceKm) {
          return false;
        }
      }

      return true;
    });
  }

  private scoreDonor(
    donor: Donor,
    request: BloodRequest,
    availableUnits: number
  ): DonorMatch {
    const rationale: string[] = [];

    const urgency = request.urgency === "critical" ? 1 : request.priorityScore ?? 0.5;
    const urgencyScore = normalizeScore(urgency, 0, 1);
    if (urgencyScore > 0.7) {
      rationale.push("High urgency request");
    }

    const gap = Math.max(request.quantity - availableUnits, 0);
    const inventoryScore = normalizeScore(gap, 0, request.quantity);
    if (inventoryScore > 0.5) {
      rationale.push("Inventory shortage");
    }

    let distanceScore = 0;
    let distanceKm: number | undefined;
    if (
      donor.latitude !== undefined &&
      donor.longitude !== undefined &&
      request.hospitalLatitude !== undefined &&
      request.hospitalLongitude !== undefined
    ) {
      distanceKm = haversineDistance(
        donor.latitude,
        donor.longitude,
        request.hospitalLatitude,
        request.hospitalLongitude
      );
      distanceScore = normalizeScore(this.maxDistanceKm - (distanceKm ?? 0), 0, this.maxDistanceKm);
      if (distanceKm <= 10) {
        rationale.push("Nearby donor");
      }
    }

    let recencyScore = 1;
    if (donor.lastDonationDate) {
      const daysSinceDonation = differenceInDays(new Date(), donor.lastDonationDate);
      recencyScore = normalizeScore(daysSinceDonation, 56, 365);
      if (recencyScore > 0.5) {
        rationale.push("Healthy donation window");
      }
    }

    let availabilityScore = 0.5;
    if (donor.availabilityWindows && donor.availabilityWindows.length) {
      const now = new Date();
      const nowIso = now.toISOString();
      const upcomingWindow = donor.availabilityWindows.find((window) => window.start <= nowIso && window.end >= nowIso);
      availabilityScore = upcomingWindow ? 1 : 0.5;
      if (upcomingWindow) {
        rationale.push("Available now");
      }
    }

    const weightedScore =
      urgencyScore * this.weights.urgencyFit +
      inventoryScore * this.weights.inventoryGap +
      distanceScore * this.weights.proximity +
      recencyScore * this.weights.donorRecency +
      availabilityScore * this.weights.availability;

    if (weightedScore <= 0) {
      return { donor, score: 0, rationale };
    }

    return {
      donor,
      score: Number(weightedScore.toFixed(3)),
      rationale,
      distanceKm: distanceKm ? Number(distanceKm.toFixed(1)) : undefined,
    };
  }
}
