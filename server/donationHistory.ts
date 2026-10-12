import type { BloodDonationTracking } from "@shared/schema";
import { storage } from "./storage";
import { DONATION_INTERVAL_DAYS, getDonorByUserId, getDonorEligibility } from "./eligibilityReminder";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Shelf life of donated red cells. */
const BLOOD_SHELF_LIFE_DAYS = 42;
/** Common estimate: one whole-blood donation can help up to three patients. */
const LIVES_PER_UNIT = 3;

export class DonationError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

const toDonationRecord = (t: BloodDonationTracking) => ({
  _id: String(t.id),
  donorId: t.donorId,
  donorName: t.donorName,
  bloodType: t.bloodType,
  unitsCollected: t.quantity,
  location: t.hospitalName,
  donationDate: new Date(t.donationDate).toISOString(),
  status: "completed" as const,
});

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const donationHistoryService = {
  /**
   * Records a donation taken at a hospital: logs it, starts the donor's deferral
   * period, and adds the collected units to the hospital's inventory.
   */
  async recordDonation(params: {
    donorIdentifier: string;
    units: number;
    donationDate?: Date;
    hospital: { id: string; name: string };
  }) {
    const identifier = params.donorIdentifier.trim();
    const user = identifier.includes("@")
      ? await storage.getUserByEmail(identifier)
      : await storage.getUserByUsername(identifier);
    const donorUserId = user ? String(user.id || user._id) : undefined;
    const donor = donorUserId ? await getDonorByUserId(donorUserId) : undefined;
    if (!user || !donor || !donorUserId) {
      throw new DonationError("No donor found with that email or username", 404);
    }

    const donationDate = params.donationDate ?? new Date();
    if (donationDate.getTime() > Date.now() + 60_000) {
      throw new DonationError("Donation date cannot be in the future");
    }
    const eligibility = getDonorEligibility(donor, donationDate);
    if (!eligibility.eligible) {
      throw new DonationError(`This donor cannot donate yet: ${eligibility.reason}`, 409);
    }

    const tracking = await storage.createBloodDonationTracking({
      donorId: donorUserId,
      donorName: `${donor.firstName} ${donor.lastName}`.trim(),
      donorEmail: user.email,
      bloodType: donor.bloodType,
      quantity: params.units,
      donationDate,
      collectionTime: donationDate,
      hospitalId: params.hospital.id,
      hospitalName: params.hospital.name,
      status: "collected",
    });

    await storage.updateDonor(String(donor.id), {
      lastDonationDate: donationDate,
      deferralUntil: new Date(donationDate.getTime() + DONATION_INTERVAL_DAYS * DAY_MS),
    });

    const inventory = await storage.createBloodInventory({
      hospitalId: params.hospital.id,
      hospitalName: params.hospital.name,
      bloodType: donor.bloodType,
      quantity: params.units,
      expiryDate: new Date(donationDate.getTime() + BLOOD_SHELF_LIFE_DAYS * DAY_MS),
      status: "available",
    });

    return { donation: toDonationRecord(tracking), inventory };
  },

  async getDonationHistory(donorUserId: string) {
    const records = await storage.getBloodDonationTrackingByDonor(donorUserId);
    return records
      .map(toDonationRecord)
      .sort((a, b) => b.donationDate.localeCompare(a.donationDate));
  },

  async getDonationStats(donorUserId: string) {
    const history = await this.getDonationHistory(donorUserId);
    const totalUnitsCollected = history.reduce((sum, d) => sum + d.unitsCollected, 0);
    const donor = await getDonorByUserId(donorUserId);
    const eligibility = donor ? getDonorEligibility(donor) : null;
    return {
      totalDonations: history.length,
      totalUnitsCollected,
      lastDonationDate: history[0]?.donationDate,
      lifesSaved: totalUnitsCollected * LIVES_PER_UNIT,
      eligible: eligibility?.eligible ?? true,
      nextEligibleDate: eligibility?.nextEligibleDate?.toISOString() ?? null,
    };
  },

  async getDonation(donationId: string) {
    const tracking = await storage.getBloodDonationTracking(donationId);
    return tracking ? toDonationRecord(tracking) : undefined;
  },

  /** A printable HTML certificate (the browser's "Save as PDF" turns it into a PDF). */
  renderCertificate(donation: ReturnType<typeof toDonationRecord>) {
    const date = new Date(donation.donationDate).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Donation Certificate - ${escapeHtml(donation.donorName)}</title>
<style>
  body{font-family:Georgia,serif;margin:0;padding:40px;background:#fff;color:#1f2937}
  .cert{max-width:760px;margin:auto;border:10px double #b91c1c;padding:48px;text-align:center}
  h1{color:#b91c1c;font-size:36px;margin:0 0 8px} .sub{letter-spacing:.2em;text-transform:uppercase;color:#6b7280}
  .name{font-size:30px;margin:28px 0 8px;border-bottom:1px solid #d1d5db;display:inline-block;padding:0 24px 6px}
  .meta{margin-top:28px;display:flex;justify-content:space-around;font-size:15px} .meta b{display:block;color:#b91c1c}
  button{margin:24px auto 0;display:block;padding:10px 20px;font-size:15px;cursor:pointer}
  @media print{button{display:none}body{padding:0}}
</style></head>
<body><div class="cert">
  <div class="sub">LifeFlow - Blood Donation Hub</div>
  <h1>Certificate of Donation</h1>
  <p>This certificate is proudly presented to</p>
  <div class="name">${escapeHtml(donation.donorName)}</div>
  <p>in grateful recognition of a voluntary blood donation that helps save lives.</p>
  <div class="meta">
    <div><b>Date</b>${escapeHtml(date)}</div>
    <div><b>Blood Type</b>${escapeHtml(donation.bloodType)}</div>
    <div><b>Units</b>${donation.unitsCollected}</div>
    <div><b>Location</b>${escapeHtml(donation.location)}</div>
  </div>
</div>
<button onclick="window.print()">Print / Save as PDF</button>
</body></html>`;
  },
};
