import test from "node:test";
import assert from "node:assert/strict";
import { MatchmakingEngine } from "./matchmaking";
import type { IStorage } from "./storage";
import {
  type BloodRequest,
  type Donor,
  type BloodInventory,
} from "@shared/schema";

const baseRequest: BloodRequest = {
  _id: "request-1",
  requesterId: "hospital-1",
  requesterName: "Central Hospital",
  hospitalName: "Central Hospital",
  hospitalLatitude: 37.7749,
  hospitalLongitude: -122.4194,
  bloodType: "O+",
  quantity: 2,
  urgency: "critical",
  patientName: "Jane Doe",
  contactNumber: "1234567890",
  status: "pending",
  createdAt: new Date(),
  updatedAt: new Date(),
  priorityScore: 0.9,
};

const inventorySnapshot: BloodInventory[] = [
  {
    _id: "inventory-1",
    hospitalId: "hospital-1",
    hospitalName: "Central Hospital",
    bloodType: "O+",
    quantity: 1,
    expiryDate: new Date(),
    status: "limited",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const toIsoWindow = (startOffsetHours: number, durationHours: number) => {
  const start = new Date(Date.now() + startOffsetHours * 60 * 60 * 1000);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
};

const createDonor = (overrides: Partial<Donor>): Donor => ({
  _id: "donor-1",
  userId: "user-1",
  firstName: "Alex",
  lastName: "Rivera",
  bloodType: "O+",
  phone: "1112223333",
  address: "123 Main St",
  state: "CA",
  region: "SF",
  lastDonationDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  latitude: 37.775,
  longitude: -122.419,
  availabilityWindows: [toIsoWindow(1, 4)],
  eligibilityStatus: "eligible",
  eligibilityNotes: [],
  deferralUntil: undefined,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

test("filters out ineligible or distant donors", async () => {
  const donors: Donor[] = [
    createDonor({ _id: "eligible-near" }),
    createDonor({
      _id: "recent-donor",
      lastDonationDate: new Date(),
    }),
    createDonor({
      _id: "temporary-deferral",
      eligibilityStatus: "temporarily_ineligible",
      deferralUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }),
    createDonor({
      _id: "too-far",
      latitude: 34.0522,
      longitude: -118.2437,
    }),
  ];

  const storage: Partial<IStorage> = {
    getBloodRequest: async () => baseRequest,
    getAllDonors: async () => donors,
    getBloodInventoryByType: async () => inventorySnapshot,
  };

  const engine = new MatchmakingEngine(storage as IStorage, {
    maxDistanceKm: 100,
  });

  const matches = await engine.suggestDonors(baseRequest._id, 5);
  assert.equal(matches.length, 1, "Only eligible nearby donor should remain");
  assert.equal(matches[0]?.donor._id, "eligible-near");
});

test("ranks donors by proximity and recency", async () => {
  const donors: Donor[] = [
    createDonor({
      _id: "close-donor",
      latitude: 37.775,
      longitude: -122.419,
      lastDonationDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    }),
    createDonor({
      _id: "farther-donor",
      latitude: 37.3382,
      longitude: -121.8863,
      lastDonationDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
    }),
  ];

  const storage: Partial<IStorage> = {
    getBloodRequest: async () => baseRequest,
    getAllDonors: async () => donors,
    getBloodInventoryByType: async () => inventorySnapshot,
  };

  const engine = new MatchmakingEngine(storage as IStorage, {
    maxDistanceKm: 150,
  });

  const matches = await engine.suggestDonors(baseRequest._id, 5);
  assert.equal(matches.length, 2);
  assert.equal(
    matches[0]?.donor._id,
    "close-donor",
    "Closer donor should rank first"
  );
  assert.ok(matches[0].score >= matches[1].score);
});

test("reuses cached results for repeat lookups", async () => {
  let requestCalls = 0;
  let donorCalls = 0;
  const donors: Donor[] = [createDonor({ _id: "cached-donor" })];

  const storage: Partial<IStorage> = {
    getBloodRequest: async () => {
      requestCalls += 1;
      return baseRequest;
    },
    getAllDonors: async () => {
      donorCalls += 1;
      return donors;
    },
    getBloodInventoryByType: async () => inventorySnapshot,
  };

  const engine = new MatchmakingEngine(storage as IStorage, {
    cacheTtlMs: 60 * 1000,
  });

  const first = await engine.suggestDonors(baseRequest._id, 5);
  assert.equal(first.length, 1);
  const second = await engine.suggestDonors(baseRequest._id, 5);
  assert.equal(second.length, 1);
  assert.equal(requestCalls, 1, "Request should be fetched once due to cache");
  assert.equal(donorCalls, 1, "Donor list should be fetched once due to cache");
});

test("throws when request is missing", async () => {
  const storage: Partial<IStorage> = {
    getBloodRequest: async () => undefined,
    getAllDonors: async () => [],
    getBloodInventoryByType: async () => [],
  };

  const engine = new MatchmakingEngine(storage as IStorage);
  await assert.rejects(() => engine.suggestDonors("unknown", 5));
});
