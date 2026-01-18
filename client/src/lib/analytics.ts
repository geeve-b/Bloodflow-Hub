import { format, parseISO, startOfDay, startOfMonth, startOfWeek, addWeeks } from "date-fns";
import type { BloodInventoryRecord } from "@/hooks/useBloodInventory";
import type {
  BloodRequestRecord,
  BloodRequestUrgency,
  BloodRequestStatus,
} from "@/hooks/useBloodRequests";
import type { InventoryStatus } from "@/lib/inventory";

export type AnalyticsGranularity = "daily" | "weekly" | "monthly";

export interface AnalyticsFilters {
  start: Date;
  end: Date;
  bloodType: string | "all";
  hospital: string | "all";
  urgency: "all" | BloodRequestUrgency;
  granularity: AnalyticsGranularity;
}

export interface DonationSeriesPoint {
  label: string;
  bucketStart: Date;
  units: number;
}

export interface RequestTrendPoint {
  label: string;
  bucketStart: Date;
  pending: number;
  approved: number;
  fulfilled: number;
  rejected: number;
}

export interface TurnoverStat {
  bloodType: string;
  inventoryUnits: number;
  fulfilledUnits: number;
  turnoverRatio: number;
}

export interface ShortageAlert {
  bloodType: string;
  hospitalName: string;
  units: number;
  status: InventoryStatus;
}

export interface ForecastPoint {
  label: string;
  bucketStart: Date;
  actual?: number;
  forecast: number;
}

const DEFAULT_WEEK_OPTIONS = { weekStartsOn: 1 as const };

const isWithinRange = (value: Date, start: Date, end: Date) => {
  const time = value.getTime();
  return time >= start.getTime() && time <= end.getTime();
};

const coerceDate = (value?: string) => {
  if (!value) return null;
  try {
    return parseISO(value);
  } catch (error) {
    return null;
  }
};

const applyInventoryFilters = (
  records: BloodInventoryRecord[],
  filters: AnalyticsFilters
) => {
  return records.filter((record) => {
    const recordDate = coerceDate(record.updatedAt ?? record.createdAt);
    if (!recordDate || !isWithinRange(recordDate, filters.start, filters.end)) {
      return false;
    }
    if (filters.bloodType !== "all" && record.bloodType !== filters.bloodType) {
      return false;
    }
    if (filters.hospital !== "all" && record.hospitalName !== filters.hospital) {
      return false;
    }
    return true;
  });
};

const applyRequestFilters = (
  records: BloodRequestRecord[],
  filters: AnalyticsFilters
) => {
  return records.filter((record) => {
    const recordDate = coerceDate(record.updatedAt ?? record.createdAt);
    if (!recordDate || !isWithinRange(recordDate, filters.start, filters.end)) {
      return false;
    }
    if (filters.bloodType !== "all" && record.bloodType !== filters.bloodType) {
      return false;
    }
    if (filters.hospital !== "all" && record.hospitalName !== filters.hospital) {
      return false;
    }
    if (filters.urgency !== "all" && record.urgency !== filters.urgency) {
      return false;
    }
    return true;
  });
};

const resolveBucketStart = (date: Date, granularity: AnalyticsGranularity) => {
  switch (granularity) {
    case "weekly":
      return startOfWeek(date, DEFAULT_WEEK_OPTIONS);
    case "monthly":
      return startOfMonth(date);
    default:
      return startOfDay(date);
  }
};

const resolveBucketLabel = (date: Date, granularity: AnalyticsGranularity) => {
  switch (granularity) {
    case "weekly":
      return `${format(date, "MMM d")} - ${format(addWeeks(date, 1), "MMM d")}`;
    case "monthly":
      return format(date, "MMM yyyy");
    default:
      return format(date, "MMM d");
  }
};

export const buildDonationSeries = (
  inventory: BloodInventoryRecord[],
  filters: AnalyticsFilters
): DonationSeriesPoint[] => {
  const filtered = applyInventoryFilters(inventory, filters);
  const buckets = new Map<string, DonationSeriesPoint>();

  for (const entry of filtered) {
    const date = coerceDate(entry.updatedAt ?? entry.createdAt);
    if (!date) continue;
    const bucketStart = resolveBucketStart(date, filters.granularity);
    const key = bucketStart.toISOString();
    const existing = buckets.get(key);
    if (existing) {
      existing.units += entry.quantity;
    } else {
      buckets.set(key, {
        bucketStart,
        label: resolveBucketLabel(bucketStart, filters.granularity),
        units: entry.quantity,
      });
    }
  }

  return Array.from(buckets.values()).sort(
    (a, b) => a.bucketStart.getTime() - b.bucketStart.getTime()
  );
};

export const buildRequestTrendSeries = (
  requests: BloodRequestRecord[],
  filters: AnalyticsFilters
): RequestTrendPoint[] => {
  const filtered = applyRequestFilters(requests, filters);
  const buckets = new Map<string, RequestTrendPoint>();

  const increment = (
    bucket: RequestTrendPoint,
    status: BloodRequestStatus,
    quantity: number
  ) => {
    switch (status) {
      case "approved":
        bucket.approved += quantity;
        break;
      case "fulfilled":
        bucket.fulfilled += quantity;
        break;
      case "rejected":
        bucket.rejected += quantity;
        break;
      default:
        bucket.pending += quantity;
        break;
    }
  };

  for (const entry of filtered) {
    const date = coerceDate(entry.updatedAt ?? entry.createdAt);
    if (!date) continue;
    const bucketStart = resolveBucketStart(date, filters.granularity);
    const key = bucketStart.toISOString();
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        bucketStart,
        label: resolveBucketLabel(bucketStart, filters.granularity),
        pending: 0,
        approved: 0,
        fulfilled: 0,
        rejected: 0,
      };
      buckets.set(key, bucket);
    }
    increment(bucket, entry.status, entry.quantity || 0);
  }

  return Array.from(buckets.values()).sort(
    (a, b) => a.bucketStart.getTime() - b.bucketStart.getTime()
  );
};

export const calculateFulfillmentRate = (
  requests: BloodRequestRecord[],
  filters: AnalyticsFilters
) => {
  const filtered = applyRequestFilters(requests, filters);
  const totals = filtered.reduce(
    (acc, entry) => {
      acc.totalRequests += 1;
      acc.totalUnits += entry.quantity || 0;
      if (entry.status === "fulfilled") {
        acc.fulfilledRequests += 1;
        acc.fulfilledUnits += entry.quantity || 0;
      }
      return acc;
    },
    {
      totalRequests: 0,
      fulfilledRequests: 0,
      totalUnits: 0,
      fulfilledUnits: 0,
    }
  );

  return {
    requestRate:
      totals.totalRequests > 0
        ? (totals.fulfilledRequests / totals.totalRequests) * 100
        : 0,
    unitRate:
      totals.totalUnits > 0
        ? (totals.fulfilledUnits / totals.totalUnits) * 100
        : 0,
    ...totals,
  };
};

export const calculateInventoryTurnover = (
  inventory: BloodInventoryRecord[],
  requests: BloodRequestRecord[],
  filters: AnalyticsFilters
): TurnoverStat[] => {
  const filteredInventory = applyInventoryFilters(inventory, filters);
  const filteredRequests = applyRequestFilters(requests, filters);

  const inventoryByType = new Map<string, number>();
  for (const entry of filteredInventory) {
    inventoryByType.set(
      entry.bloodType,
      (inventoryByType.get(entry.bloodType) ?? 0) + entry.quantity
    );
  }

  const fulfilledByType = new Map<string, number>();
  for (const entry of filteredRequests) {
    if (entry.status === "fulfilled" || entry.status === "approved") {
      fulfilledByType.set(
        entry.bloodType,
        (fulfilledByType.get(entry.bloodType) ?? 0) + entry.quantity
      );
    }
  }

  const result = new Map<string, TurnoverStat>();

  const bloodTypes = new Set<string>([
    ...inventoryByType.keys(),
    ...fulfilledByType.keys(),
  ]);

  bloodTypes.forEach((type) => {
    const inventoryUnits = inventoryByType.get(type) ?? 0;
    const fulfilledUnits = fulfilledByType.get(type) ?? 0;
    const turnoverRatio = inventoryUnits > 0 ? fulfilledUnits / inventoryUnits : 0;
    result.set(type, {
      bloodType: type,
      inventoryUnits,
      fulfilledUnits,
      turnoverRatio,
    });
  });

  return Array.from(result.values()).sort(
    (a, b) => b.turnoverRatio - a.turnoverRatio
  );
};

export const identifyShortages = (
  inventory: BloodInventoryRecord[],
  filters: AnalyticsFilters,
  threshold = 10
): ShortageAlert[] => {
  const filtered = applyInventoryFilters(inventory, filters);
  const grouped = new Map<string, ShortageAlert>();

  for (const entry of filtered) {
    const key = `${entry.hospitalId}-${entry.bloodType}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.units += entry.quantity;
      if (entry.status === "not_available" || entry.status === "limited") {
        existing.status = entry.status;
      }
    } else {
      grouped.set(key, {
        bloodType: entry.bloodType,
        hospitalName: entry.hospitalName,
        units: entry.quantity,
        status: entry.status,
      });
    }
  }

  return Array.from(grouped.values())
    .filter((item) => item.units <= threshold || item.status !== "available")
    .sort((a, b) => a.units - b.units);
};

export const generateDemandForecast = (
  requests: BloodRequestRecord[],
  filters: AnalyticsFilters,
  projectionPeriods = 4
): ForecastPoint[] => {
  const filtered = applyRequestFilters(requests, {
    ...filters,
    granularity: "weekly",
  });

  const weeklyBuckets = new Map<string, { bucketStart: Date; value: number }>();

  for (const entry of filtered) {
    const date = coerceDate(entry.updatedAt ?? entry.createdAt);
    if (!date) continue;
    const bucketStart = startOfWeek(date, DEFAULT_WEEK_OPTIONS);
    const key = bucketStart.toISOString();
    weeklyBuckets.set(key, {
      bucketStart,
      value: (weeklyBuckets.get(key)?.value ?? 0) + (entry.quantity || 0),
    });
  }

  const points = Array.from(weeklyBuckets.values()).sort(
    (a, b) => a.bucketStart.getTime() - b.bucketStart.getTime()
  );

  if (points.length === 0) {
    return [];
  }

  const n = points.length;
  const xs = points.map((_, index) => index);
  const ys = points.map((point) => point.value);

  const sumX = xs.reduce((acc, value) => acc + value, 0);
  const sumY = ys.reduce((acc, value) => acc + value, 0);
  const sumXY = xs.reduce((acc, value, index) => acc + value * ys[index], 0);
  const sumXX = xs.reduce((acc, value) => acc + value * value, 0);

  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  const intercept = n !== 0 ? (sumY - slope * sumX) / n : 0;

  const forecast: ForecastPoint[] = points.map((point, index) => ({
    bucketStart: point.bucketStart,
    label: resolveBucketLabel(point.bucketStart, "weekly"),
    actual: point.value,
    forecast: Math.max(0, intercept + slope * index),
  }));

  const lastBucket = points[points.length - 1]?.bucketStart ?? new Date();

  for (let i = 1; i <= projectionPeriods; i += 1) {
    const futureIndex = n - 1 + i;
    const forecastDate = startOfWeek(addWeeks(lastBucket, i), DEFAULT_WEEK_OPTIONS);
    forecast.push({
      bucketStart: forecastDate,
      label: resolveBucketLabel(forecastDate, "weekly"),
      forecast: Math.max(0, intercept + slope * futureIndex),
    });
  }

  return forecast;
};
