import type { Donor } from "@shared/schema";
import { storage } from "./storage";

/** Minimum gap between whole-blood donations. */
export const DONATION_INTERVAL_DAYS = 56;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface EligibilitySummary {
  eligible: boolean;
  reason: string | null;
  lastDonationDate: Date | null;
  nextEligibleDate: Date | null;
}

export function getDonorEligibility(donor: Donor, now = new Date()): EligibilitySummary {
  const lastDonationDate = donor.lastDonationDate ? new Date(donor.lastDonationDate) : null;
  const intervalEnd = lastDonationDate
    ? new Date(lastDonationDate.getTime() + DONATION_INTERVAL_DAYS * DAY_MS)
    : null;
  const deferralEnd = donor.deferralUntil ? new Date(donor.deferralUntil) : null;
  const candidates = [intervalEnd, deferralEnd].filter((d): d is Date => Boolean(d));
  const nextEligibleDate = candidates.length
    ? new Date(Math.max(...candidates.map((d) => d.getTime())))
    : null;

  if (!donor.isActive) {
    return { eligible: false, reason: "Donor profile is inactive", lastDonationDate, nextEligibleDate: null };
  }
  if (donor.eligibilityStatus === "permanently_ineligible") {
    return { eligible: false, reason: "Permanently ineligible to donate", lastDonationDate, nextEligibleDate: null };
  }
  if (nextEligibleDate && nextEligibleDate > now) {
    return {
      eligible: false,
      reason: `Next eligible on ${nextEligibleDate.toDateString()}`,
      lastDonationDate,
      nextEligibleDate,
    };
  }
  return { eligible: true, reason: null, lastDonationDate, nextEligibleDate };
}

export async function getDonorByUserId(userId: string): Promise<Donor | undefined> {
  const donors = await storage.getAllDonors();
  return donors.find((d) => d.userId === userId);
}

// Reminders are derived from the donor's donation dates rather than stored, so they are
// always in sync with recorded donations.
export const eligibilityReminderService = {
  async getReminders(donorUserId: string) {
    const donor = await getDonorByUserId(donorUserId);
    if (!donor) return [];
    const { eligible, lastDonationDate, nextEligibleDate } = getDonorEligibility(donor);
    if (!lastDonationDate || !nextEligibleDate) return [];

    const createdAt = lastDonationDate.toISOString();
    return [
      {
        _id: `eligibility-${donor.id}-${nextEligibleDate.getTime()}`,
        donorId: donorUserId,
        reminderType: eligible ? "eligibility_reached" : "pre_eligibility",
        scheduledFor: nextEligibleDate.toISOString(),
        message: eligible
          ? "You're eligible to donate again. Book your next donation and help save lives!"
          : `Thank you for donating! You can donate again from ${nextEligibleDate.toDateString()}.`,
        nextEligibleDate: nextEligibleDate.toISOString(),
        acknowledged: false,
        createdAt,
      },
    ];
  },

  async markReminderAsAcknowledged(_reminderId: string) {
    return { success: true };
  },
};
