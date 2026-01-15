import type { BloodRequest, BloodInventory } from "@shared/schema";

export interface BloodRequestFilters {
  bloodType?: string;
  urgency?: "low" | "medium" | "high" | "critical";
  location?: string;
  status?: "pending" | "approved" | "fulfilled" | "rejected";
  search?: string;
}

export interface PaginationParams {
  skip: number;
  limit: number;
}

export function buildMongoQuery(filters: BloodRequestFilters): Record<string, any> {
  const query: Record<string, any> = {};

  if (filters.bloodType) {
    query.bloodType = filters.bloodType;
  }

  if (filters.urgency) {
    query.urgency = filters.urgency;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.location) {
    const locationRegex = new RegExp(filters.location, "i");
    query.$or = [
      { hospitalName: { $regex: locationRegex } },
    ];
  }

  if (filters.search) {
    const searchRegex = new RegExp(filters.search, "i");
    const searchConditions = [
      { bloodType: { $regex: searchRegex } },
      { hospitalName: { $regex: searchRegex } },
      { requesterName: { $regex: searchRegex } },
    ];

    if (query.$or) {
      query.$or = [...query.$or, ...searchConditions];
    } else {
      query.$or = searchConditions;
    }
  }

  return query;
}

export function calculateDaysRemaining(expiryDate: Date): number {
  const now = new Date();
  return Math.ceil(
    (new Date(expiryDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
  );
}

export function isBloodExpiringSoon(
  expiryDate: Date,
  warningDays: number = 7
): boolean {
  const daysRemaining = calculateDaysRemaining(expiryDate);
  return daysRemaining >= 0 && daysRemaining <= warningDays;
}

export function isBloodExpired(expiryDate: Date): boolean {
  return new Date() > new Date(expiryDate);
}

export interface ExpiryAlertData extends Omit<BloodInventory, "status"> {
  status: "available" | "reserved";
  daysRemaining: number;
  expiryStatus: "critical" | "warning" | "normal";
}

export function categorizeExpiryStatus(
  daysRemaining: number
): "critical" | "warning" | "normal" {
  if (daysRemaining <= 2) return "critical";
  if (daysRemaining <= 7) return "warning";
  return "normal";
}

export function buildExpiryQuery(
  days: number
): {
  statusFilter: string[];
  dateRange: {
    $gte: Date;
    $lte: Date;
  };
} {
  const now = new Date();
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return {
    statusFilter: ["available", "reserved"],
    dateRange: {
      $gte: now,
      $lte: threshold,
    },
  };
}
