import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import {
  type BloodInventory,
  type BloodRequest,
  type BloodExpiryAlert,
  type BloodDonationTracking,
  type Donor,
  type InsertBloodInventory,
  type InsertBloodRequest,
  type InsertBloodExpiryAlert,
  type InsertBloodDonationTracking,
  type InsertDonor,
  type InsertStaff,
  type InsertUser,
  type Staff,
  type User,
} from "@shared/schema";
import { db } from "./db";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  setEmailVerificationCode(
    id: string,
    codeHash: string,
    expiresAt: Date
  ): Promise<User | undefined>;
  markEmailVerified(id: string): Promise<User | undefined>;
  setResetPasswordToken(
    id: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<User | undefined>;
  clearResetPasswordToken(id: string): Promise<User | undefined>;

  getBloodInventory(id: string): Promise<BloodInventory | undefined>;
  getAllBloodInventory(): Promise<BloodInventory[]>;
  getBloodInventoryByHospital(hospitalId: string): Promise<BloodInventory[]>;
  getBloodInventoryByType(bloodType: string): Promise<BloodInventory[]>;
  getBloodInventoryExpiringWithin(
    days: number
  ): Promise<Array<BloodInventory & { daysRemaining: number }>>;
  createBloodInventory(inventory: InsertBloodInventory): Promise<BloodInventory>;
  updateBloodInventory(
    id: string,
    inventory: Partial<InsertBloodInventory>
  ): Promise<BloodInventory | undefined>;
  deleteBloodInventory(id: string): Promise<boolean>;

  getBloodRequest(id: string): Promise<BloodRequest | undefined>;
  getAllBloodRequests(): Promise<BloodRequest[]>;
  getBloodRequestsByStatus(status: string): Promise<BloodRequest[]>;
  searchAndFilterBloodRequests(
    filters: {
      bloodType?: string;
      urgency?: string;
      location?: string;
      status?: string;
      search?: string;
    },
    pagination?: {
      skip: number;
      limit: number;
    }
  ): Promise<{ requests: BloodRequest[]; total: number }>;
  createBloodRequest(request: InsertBloodRequest): Promise<BloodRequest>;
  updateBloodRequest(
    id: string,
    request: Partial<InsertBloodRequest>
  ): Promise<BloodRequest | undefined>;
  deleteBloodRequest(id: string): Promise<boolean>;

  getDonor(id: string): Promise<Donor | undefined>;
  getAllDonors(): Promise<Donor[]>;
  getDonorsByBloodType(bloodType: string): Promise<Donor[]>;
  getEligibleDonorsWithEmails(bloodTypes: string | string[], region?: string): Promise<Array<{ donor: Donor; email: string; username: string }>>;
  createDonor(donor: InsertDonor): Promise<Donor>;
  updateDonor(id: string, donor: Partial<InsertDonor>): Promise<Donor | undefined>;
  deleteDonor(id: string): Promise<boolean>;

  getStaff(id: string): Promise<Staff | undefined>;
  getAllStaff(): Promise<Staff[]>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: string, staff: Partial<InsertStaff>): Promise<Staff | undefined>;
  deleteStaff(id: string): Promise<boolean>;

  getReceiver(id: string): Promise<any | undefined>;
  getAllReceivers(): Promise<any[]>;
  getReceiversByBloodType(bloodType: string): Promise<any[]>;
  createReceiver(receiver: any): Promise<any>;
  updateReceiver(id: string, receiver: Partial<any>): Promise<any | undefined>;
  deleteReceiver(id: string): Promise<boolean>;

  // Blood Expiry Alert Methods
  getBloodExpiryAlert(id: string): Promise<BloodExpiryAlert | undefined>;
  getAllBloodExpiryAlerts(): Promise<BloodExpiryAlert[]>;
  getBloodExpiryAlertsByHospital(hospitalId: string): Promise<BloodExpiryAlert[]>;
  getBloodExpiryAlertsByLevel(alertLevel: string): Promise<BloodExpiryAlert[]>;
  getActiveBloodExpiryAlerts(resolved?: boolean): Promise<BloodExpiryAlert[]>;
  createBloodExpiryAlert(alert: InsertBloodExpiryAlert): Promise<BloodExpiryAlert>;
  updateBloodExpiryAlert(id: string, alert: Partial<InsertBloodExpiryAlert>): Promise<BloodExpiryAlert | undefined>;
  acknowledgeBloodExpiryAlert(id: string, userId: string, notes?: string): Promise<BloodExpiryAlert | undefined>;
  resolveBloodExpiryAlert(id: string, userId: string, notes?: string): Promise<BloodExpiryAlert | undefined>;
  deleteBloodExpiryAlert(id: string): Promise<boolean>;
  checkAndCreateExpiryAlerts(): Promise<BloodExpiryAlert[]>;

  // Blood Donation Tracking Methods
  getBloodDonationTracking(id: string): Promise<BloodDonationTracking | undefined>;
  getAllBloodDonationTracking(): Promise<BloodDonationTracking[]>;
  getBloodDonationTrackingByDonor(donorId: string): Promise<BloodDonationTracking[]>;
  getBloodDonationTrackingByReceiver(receiverId: string): Promise<BloodDonationTracking[]>;
  getBloodDonationTrackingByStatus(status: string): Promise<BloodDonationTracking[]>;
  getBloodDonationTrackingByHospital(hospitalId: string): Promise<BloodDonationTracking[]>;
  createBloodDonationTracking(tracking: InsertBloodDonationTracking): Promise<BloodDonationTracking>;
  updateBloodDonationTracking(id: string, tracking: Partial<InsertBloodDonationTracking>): Promise<BloodDonationTracking | undefined>;
  updateBloodDonationTrackingStatus(id: string, status: string, note?: string, updatedBy?: string): Promise<BloodDonationTracking | undefined>;
  deleteBloodDonationTracking(id: string): Promise<boolean>;
}

const toObjectId = (id: string) => {
  try {
    return new ObjectId(id);
  } catch (error) {
    throw new Error(`Invalid ID format: ${id}`);
  }
};

const normalize = <T>(doc: any | null): T | undefined => {
  if (!doc) {
    return undefined;
  }
  const { _id, ...rest } = doc;
  const normalizedId =
    typeof _id === "string" ? _id : _id?.toString ? _id.toString() : undefined;
  return { ...rest, _id: normalizedId } as T;
};

const normalizeMany = <T>(docs: any[]): T[] => {
  return docs
    .map((doc) => normalize<T>(doc))
    .filter((doc): doc is T => Boolean(doc));
};

const removeUndefined = (value: Record<string, unknown>) => {
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) {
      result[key] = entry;
    }
  }
  return result;
};

export class MongoDBStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const user = await db.collection("users").findOne({ _id: toObjectId(id) });
    return normalize<User>(user);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const normalized = username.trim().toLowerCase();
    const user =
      (await db.collection("users").findOne({
        $expr: {
          $eq: [
            {
              $toLower: {
                $trim: { input: "$username" },
              },
            },
            normalized,
          ],
        },
      })) ??
      (await db
        .collection("users")
        .findOne({ username })) ??
      (await db
        .collection("users")
        .findOne({ username: normalized }));
    return normalize<User>(user);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const normalized = email.trim().toLowerCase();
    const user =
      (await db.collection("users").findOne({
        $expr: {
          $eq: [
            {
              $toLower: {
                $trim: { input: "$email" },
              },
            },
            normalized,
          ],
        },
      })) ??
      (await db
        .collection("users")
        .findOne({ email: normalized }));
    return normalize<User>(user);
  }

  async getAllUsers(): Promise<User[]> {
    const users = await db.collection("users").find({}).toArray();
    return normalizeMany<User>(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const now = new Date();
    const document = {
      ...user,
      username: user.username.trim(),
      email: user.email.trim().toLowerCase(),
      password: await bcrypt.hash(user.password, 10),
      emailVerified: false,
      emailVerificationCode: null,
      emailVerificationExpiresAt: null,
      createdAt: now,
      updatedAt: now,
    };
    const result = await db.collection("users").insertOne(document);
    return normalize<User>({ ...document, _id: result.insertedId })!;
  }

  async setEmailVerificationCode(
    id: string,
    codeHash: string,
    expiresAt: Date
  ): Promise<User | undefined> {
    const result = await db
      .collection("users")
      .findOneAndUpdate(
        { _id: toObjectId(id) },
        {
          $set: {
            emailVerificationCode: codeHash,
            emailVerificationExpiresAt: expiresAt,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      );
    const updated = (result as any)?.value ?? result ?? null;
    return normalize<User>(updated);
  }

  async markEmailVerified(id: string): Promise<User | undefined> {
    const result = await db
      .collection("users")
      .findOneAndUpdate(
        { _id: toObjectId(id) },
        {
          $set: {
            emailVerified: true,
            emailVerificationCode: null,
            emailVerificationExpiresAt: null,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      );
    const updated = (result as any)?.value ?? result ?? null;
    return normalize<User>(updated);
  }

  async setResetPasswordToken(
    id: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<User | undefined> {
    const result = await db
      .collection("users")
      .findOneAndUpdate(
        { _id: toObjectId(id) },
        {
          $set: {
            resetPasswordToken: tokenHash,
            resetPasswordExpires: expiresAt,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      );
    const updated = (result as any)?.value ?? result ?? null;
    return normalize<User>(updated);
  }

  async clearResetPasswordToken(id: string): Promise<User | undefined> {
    const result = await db
      .collection("users")
      .findOneAndUpdate(
        { _id: toObjectId(id) },
        {
          $set: {
            resetPasswordToken: null,
            resetPasswordExpires: null,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      );
    const updated = (result as any)?.value ?? result ?? null;
    return normalize<User>(updated);
  }

  async updateUser(
    id: string,
    user: Partial<InsertUser>
  ): Promise<User | undefined> {
    const { password, username, email, ...rest } = user;
    const updatePayload = removeUndefined({
      ...rest,
      updatedAt: new Date(),
    });
    if (username !== undefined) {
      updatePayload.username = username.trim();
    }
    if (email !== undefined) {
      updatePayload.email = email.trim().toLowerCase();
    }
    if (password) {
      updatePayload.password = await bcrypt.hash(password, 10);
    }
    const result = await db
      .collection("users")
      .findOneAndUpdate(
        { _id: toObjectId(id) },
        { $set: updatePayload },
        { returnDocument: "after" }
      );
    const updated = (result as any)?.value ?? result ?? null;
    return normalize<User>(updated);
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db
      .collection("users")
      .deleteOne({ _id: toObjectId(id) });
    return result.deletedCount === 1;
  }

  async getBloodInventory(id: string): Promise<BloodInventory | undefined> {
    const inventory = await db
      .collection("bloodInventory")
      .findOne({ _id: toObjectId(id) });
    return normalize<BloodInventory>(inventory);
  }

  async getAllBloodInventory(): Promise<BloodInventory[]> {
    const inventory = await db.collection("bloodInventory").find({}).toArray();
    return normalizeMany<BloodInventory>(inventory);
  }

  async getBloodInventoryByHospital(
    hospitalId: string
  ): Promise<BloodInventory[]> {
    const inventory = await db
      .collection("bloodInventory")
      .find({ hospitalId })
      .toArray();
    return normalizeMany<BloodInventory>(inventory);
  }

  async getBloodInventoryByType(
    bloodType: string
  ): Promise<BloodInventory[]> {
    const inventory = await db
      .collection("bloodInventory")
      .find({ bloodType, status: "available" })
      .toArray();
    return normalizeMany<BloodInventory>(inventory);
  }

  async getBloodInventoryExpiringWithin(
    days: number
  ): Promise<Array<BloodInventory & { daysRemaining: number }>> {
    const now = new Date();
    const expiryThreshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const inventory = await db
      .collection("bloodInventory")
      .find({
        status: { $in: ["available", "reserved"] },
        expiryDate: {
          $gte: now,
          $lte: expiryThreshold,
        },
      })
      .sort({ expiryDate: 1 })
      .toArray();

    return inventory.map((item) => {
      const normalized = normalize<BloodInventory>(item);
      if (!normalized) return null;
      const daysRemaining = Math.ceil(
        (new Date(normalized.expiryDate).getTime() - now.getTime()) /
          (24 * 60 * 60 * 1000)
      );
      return { ...normalized, daysRemaining };
    }).filter((item): item is BloodInventory & { daysRemaining: number } => item !== null);
  }

  async createBloodInventory(
    inventory: InsertBloodInventory
  ): Promise<BloodInventory> {
    const now = new Date();
    const document = {
      ...inventory,
      createdAt: now,
      updatedAt: now,
    };
    const result = await db
      .collection("bloodInventory")
      .insertOne(document);
    return normalize<BloodInventory>({ ...document, _id: result.insertedId })!;
  }

  async updateBloodInventory(
    id: string,
    inventory: Partial<InsertBloodInventory>
  ): Promise<BloodInventory | undefined> {
    const updatePayload = removeUndefined({
      ...inventory,
      updatedAt: new Date(),
    });
    const result = await db
      .collection("bloodInventory")
      .findOneAndUpdate(
        { _id: toObjectId(id) },
        { $set: updatePayload },
        { returnDocument: "after" }
      );
    const updated = (result as any)?.value ?? result ?? null;
    return normalize<BloodInventory>(updated);
  }

  async deleteBloodInventory(id: string): Promise<boolean> {
    const result = await db
      .collection("bloodInventory")
      .deleteOne({ _id: toObjectId(id) });
    return result.deletedCount === 1;
  }

  async getBloodRequest(id: string): Promise<BloodRequest | undefined> {
    const request = await db
      .collection("bloodRequests")
      .findOne({ _id: toObjectId(id) });
    return normalize<BloodRequest>(request);
  }

  async getAllBloodRequests(): Promise<BloodRequest[]> {
    const requests = await db.collection("bloodRequests").find({}).toArray();
    return normalizeMany<BloodRequest>(requests);
  }

  async getBloodRequestsByStatus(
    status: string
  ): Promise<BloodRequest[]> {
    const requests = await db
      .collection("bloodRequests")
      .find({ status })
      .toArray();
    return normalizeMany<BloodRequest>(requests);
  }

  async searchAndFilterBloodRequests(
    filters: {
      bloodType?: string;
      urgency?: string;
      location?: string;
      status?: string;
      search?: string;
    },
    pagination?: {
      skip: number;
      limit: number;
    }
  ): Promise<{ requests: BloodRequest[]; total: number }> {
    const query: any = {};

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
        ...(query.$or || []),
      ];
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, "i");
      query.$or = [
        { bloodType: { $regex: searchRegex } },
        { hospitalName: { $regex: searchRegex } },
        { requesterName: { $regex: searchRegex } },
        ...(query.$or || []).filter(
          (item: any) => !item.hospitalName || item.hospitalName !== query.$or[0]?.hospitalName
        ),
      ];
    }

    const collection = db.collection("bloodRequests");
    const total = await collection.countDocuments(query);

    const requests = await collection
      .find(query)
      .skip(pagination?.skip || 0)
      .limit(pagination?.limit || 100)
      .sort({ createdAt: -1 })
      .toArray();

    return {
      requests: normalizeMany<BloodRequest>(requests),
      total,
    };
  }

  async createBloodRequest(
    request: InsertBloodRequest
  ): Promise<BloodRequest> {
    const now = new Date();
    const document = {
      ...request,
      createdAt: now,
      updatedAt: now,
    };
    const result = await db
      .collection("bloodRequests")
      .insertOne(document);
    return normalize<BloodRequest>({ ...document, _id: result.insertedId })!;
  }

  async updateBloodRequest(
    id: string,
    request: Partial<InsertBloodRequest>
  ): Promise<BloodRequest | undefined> {
    const updatePayload = removeUndefined({
      ...request,
      updatedAt: new Date(),
    });
    
    try {
      const result = await db
        .collection("bloodRequests")
        .findOneAndUpdate(
          { _id: toObjectId(id) },
          { $set: updatePayload },
          { returnDocument: "after" }
        );
      
      const updated = (result as any)?.value ?? result ?? null;
      return normalize<BloodRequest>(updated);
    } catch (error) {
      console.error(`[ERROR] Failed to update blood request ${id}:`, error);
      return undefined;
    }
  }

  async deleteBloodRequest(id: string): Promise<boolean> {
    const result = await db
      .collection("bloodRequests")
      .deleteOne({ _id: toObjectId(id) });
    return result.deletedCount === 1;
  }

  async getDonor(id: string): Promise<Donor | undefined> {
    const donor = await db
      .collection("donors")
      .findOne({ _id: toObjectId(id) });
    return normalize<Donor>(donor);
  }

  async getAllDonors(): Promise<Donor[]> {
    const donors = await db.collection("donors").find({}).toArray();
    return normalizeMany<Donor>(donors);
  }

  async getDonorsByBloodType(bloodType: string): Promise<Donor[]> {
    const donors = await db
      .collection("donors")
      .find({ bloodType, isActive: true })
      .toArray();
    return normalizeMany<Donor>(donors);
  }

  async getEligibleDonorsWithEmails(bloodTypesInput: string | string[], region?: string): Promise<Array<{ donor: Donor; email: string; username: string }>> {
    try {
      // Handle both single string and array of strings
      const bloodTypes = Array.isArray(bloodTypesInput) ? bloodTypesInput : [bloodTypesInput];
      
      // Build query with blood type filter
      const query: any = {
        bloodType: { $in: bloodTypes },
        $or: [{ isActive: true }, { isActive: { $exists: false } }]
      };

      // Add region filter if provided - match any of: region, state, or address
      if (region) {
        const regionRegex = new RegExp(region, "i");
        query.$and = [
          {
            $or: [
              { region: { $regex: regionRegex } },
              { state: { $regex: regionRegex } },
              { address: { $regex: regionRegex } }
            ]
          }
        ];
      }
      
      // Find all active donors with matching blood types and region
      // Note: isActive defaults to true, but we also check for undefined to catch existing donors
      const donors = await db
        .collection("donors")
        .find(query)
        .toArray();

      console.log(`[DEBUG] getEligibleDonorsWithEmails: Found ${donors.length} donors for blood types ${bloodTypes.join(", ")}${region ? ` in region ${region}` : ""}`);

      if (donors.length === 0) {
        return [];
      }

      // For each donor, fetch their user information to get email
      const donorsWithEmails: Array<{ donor: Donor; email: string; username: string }> = [];

      for (const donorDoc of donors) {
        try {
          const donor = normalize<Donor>(donorDoc);
          if (!donor) {
            console.log("[DEBUG] Failed to normalize donor document");
            continue;
          }

          console.log(`[DEBUG] Processing donor: ${donor.firstName} ${donor.lastName}, userId: ${donor.userId}`);

          // Fetch the user associated with this donor
          let userId: ObjectId;
          try {
            userId = toObjectId(donor.userId);
          } catch (e) {
            console.log(`[DEBUG] Invalid userId format: ${donor.userId}`);
            continue;
          }

          const user = await db
            .collection("users")
            .findOne({ _id: userId });

          if (!user) {
            console.log(`[DEBUG] No user found for donor userId: ${donor.userId}`);
            continue;
          }

          if (!user.email) {
            console.log(`[DEBUG] User ${donor.userId} has no email`);
            continue;
          }

          console.log(`[DEBUG] Successfully found email ${user.email} for donor ${donor.firstName} ${donor.lastName}`);

          donorsWithEmails.push({
            donor,
            email: user.email,
            username: user.username || `${donor.firstName} ${donor.lastName}`,
          });
        } catch (itemError) {
          console.error(`[ERROR] Error processing donor:`, itemError);
          continue;
        }
      }

      console.log(`[DEBUG] Total eligible donors with valid emails: ${donorsWithEmails.length}`);
      return donorsWithEmails;
    } catch (error) {
      console.error("[ERROR] Failed to get eligible donors with emails:", error);
      throw error;
    }
  }

  async createDonor(donor: InsertDonor): Promise<Donor> {
    const now = new Date();
    const document = {
      ...donor,
      eligibilityStatus: donor.eligibilityStatus ?? "eligible",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    const result = await db.collection("donors").insertOne(document);
    return normalize<Donor>({ ...document, _id: result.insertedId })!;
  }

  async updateDonor(
    id: string,
    donor: Partial<InsertDonor>
  ): Promise<Donor | undefined> {
    const updatePayload = removeUndefined({
      ...donor,
      updatedAt: new Date(),
    });
    const result = await db
      .collection("donors")
      .findOneAndUpdate(
        { _id: toObjectId(id) },
        { $set: updatePayload },
        { returnDocument: "after" }
      );
    const updated = (result as any)?.value ?? result ?? null;
    return normalize<Donor>(updated);
  }

  async deleteDonor(id: string): Promise<boolean> {
    const result = await db
      .collection("donors")
      .deleteOne({ _id: toObjectId(id) });
    return result.deletedCount === 1;
  }

  async getStaff(id: string): Promise<Staff | undefined> {
    const staff = await db.collection("staff").findOne({ _id: toObjectId(id) });
    return normalize<Staff>(staff);
  }

  async getAllStaff(): Promise<Staff[]> {
    const staffMembers = await db.collection("staff").find({}).toArray();
    return normalizeMany<Staff>(staffMembers);
  }

  async createStaff(staff: InsertStaff): Promise<Staff> {
    const now = new Date();
    const document = {
      ...staff,
      createdAt: now,
      updatedAt: now,
    };
    const result = await db.collection("staff").insertOne(document);
    return normalize<Staff>({ ...document, _id: result.insertedId })!;
  }

  async updateStaff(
    id: string,
    staff: Partial<InsertStaff>
  ): Promise<Staff | undefined> {
    const updatePayload = removeUndefined({
      ...staff,
      updatedAt: new Date(),
    });
    const result = await db
      .collection("staff")
      .findOneAndUpdate(
        { _id: toObjectId(id) },
        { $set: updatePayload },
        { returnDocument: "after" }
      );
    const updated = (result as any)?.value ?? result ?? null;
    return normalize<Staff>(updated);
  }

  async deleteStaff(id: string): Promise<boolean> {
    const result = await db.collection("staff").deleteOne({ _id: toObjectId(id) });
    return result.deletedCount === 1;
  }

  async getReceiver(id: string): Promise<any | undefined> {
    const receiver = await db.collection("receivers").findOne({ _id: toObjectId(id) });
    return normalize<any>(receiver);
  }

  async getAllReceivers(): Promise<any[]> {
    const receivers = await db.collection("receivers").find({}).toArray();
    return normalizeMany<any>(receivers);
  }

  async getReceiversByBloodType(bloodType: string): Promise<any[]> {
    const receivers = await db
      .collection("receivers")
      .find({ bloodType })
      .toArray();
    return normalizeMany<any>(receivers);
  }

  async createReceiver(receiver: any): Promise<any> {
    const now = new Date();
    const document = {
      ...receiver,
      createdAt: now,
      updatedAt: now,
    };
    const result = await db.collection("receivers").insertOne(document);
    return normalize<any>({ ...document, _id: result.insertedId })!;
  }

  async updateReceiver(
    id: string,
    receiver: Partial<any>
  ): Promise<any | undefined> {
    const updatePayload = removeUndefined({
      ...receiver,
      updatedAt: new Date(),
    });
    const result = await db
      .collection("receivers")
      .findOneAndUpdate(
        { _id: toObjectId(id) },
        { $set: updatePayload },
        { returnDocument: "after" }
      );
    const updated = (result as any)?.value ?? result ?? null;
    return normalize<any>(updated);
  }

  async deleteReceiver(id: string): Promise<boolean> {
    const result = await db.collection("receivers").deleteOne({ _id: toObjectId(id) });
    return result.deletedCount === 1;
  }

  // ==================== BLOOD EXPIRY ALERT METHODS ====================
  async getBloodExpiryAlert(id: string): Promise<BloodExpiryAlert | undefined> {
    const alert = await db
      .collection("bloodExpiryAlerts")
      .findOne({ _id: toObjectId(id) });
    return normalize<BloodExpiryAlert>(alert);
  }

  async getAllBloodExpiryAlerts(): Promise<BloodExpiryAlert[]> {
    const alerts = await db
      .collection("bloodExpiryAlerts")
      .find({})
      .sort({ alertSentAt: -1 })
      .toArray();
    return normalizeMany<BloodExpiryAlert>(alerts);
  }

  async getBloodExpiryAlertsByHospital(hospitalId: string): Promise<BloodExpiryAlert[]> {
    const alerts = await db
      .collection("bloodExpiryAlerts")
      .find({ hospitalId })
      .sort({ alertSentAt: -1 })
      .toArray();
    return normalizeMany<BloodExpiryAlert>(alerts);
  }

  async getBloodExpiryAlertsByLevel(alertLevel: string): Promise<BloodExpiryAlert[]> {
    const alerts = await db
      .collection("bloodExpiryAlerts")
      .find({ alertLevel })
      .sort({ alertSentAt: -1 })
      .toArray();
    return normalizeMany<BloodExpiryAlert>(alerts);
  }

  async getActiveBloodExpiryAlerts(resolved = false): Promise<BloodExpiryAlert[]> {
    const alerts = await db
      .collection("bloodExpiryAlerts")
      .find({ resolved })
      .sort({ alertSentAt: -1 })
      .toArray();
    return normalizeMany<BloodExpiryAlert>(alerts);
  }

  async createBloodExpiryAlert(
    alert: InsertBloodExpiryAlert
  ): Promise<BloodExpiryAlert> {
    const now = new Date();
    const document = {
      ...alert,
      createdAt: now,
      updatedAt: now,
    };
    const result = await db
      .collection("bloodExpiryAlerts")
      .insertOne(document);
    return normalize<BloodExpiryAlert>({ ...document, _id: result.insertedId })!;
  }

  async updateBloodExpiryAlert(
    id: string,
    alert: Partial<InsertBloodExpiryAlert>
  ): Promise<BloodExpiryAlert | undefined> {
    const updatePayload = removeUndefined({
      ...alert,
      updatedAt: new Date(),
    });
    const result = await db
      .collection("bloodExpiryAlerts")
      .findOneAndUpdate(
        { _id: toObjectId(id) },
        { $set: updatePayload },
        { returnDocument: "after" }
      );
    const updated = (result as any)?.value ?? result ?? null;
    return normalize<BloodExpiryAlert>(updated);
  }

  async acknowledgeBloodExpiryAlert(
    id: string,
    userId: string,
    notes?: string
  ): Promise<BloodExpiryAlert | undefined> {
    const updatePayload = {
      acknowledged: true,
      acknowledgedBy: userId,
      acknowledgedAt: new Date(),
      ...(notes && { acknowledgedNotes: notes }),
      updatedAt: new Date(),
    };
    const result = await db
      .collection("bloodExpiryAlerts")
      .findOneAndUpdate(
        { _id: toObjectId(id) },
        { $set: updatePayload },
        { returnDocument: "after" }
      );
    const updated = (result as any)?.value ?? result ?? null;
    return normalize<BloodExpiryAlert>(updated);
  }

  async resolveBloodExpiryAlert(
    id: string,
    userId: string,
    notes?: string
  ): Promise<BloodExpiryAlert | undefined> {
    const updatePayload = {
      resolved: true,
      resolvedBy: userId,
      resolvedAt: new Date(),
      ...(notes && { resolvedNotes: notes }),
      updatedAt: new Date(),
    };
    const result = await db
      .collection("bloodExpiryAlerts")
      .findOneAndUpdate(
        { _id: toObjectId(id) },
        { $set: updatePayload },
        { returnDocument: "after" }
      );
    const updated = (result as any)?.value ?? result ?? null;
    return normalize<BloodExpiryAlert>(updated);
  }

  async deleteBloodExpiryAlert(id: string): Promise<boolean> {
    const result = await db
      .collection("bloodExpiryAlerts")
      .deleteOne({ _id: toObjectId(id) });
    return result.deletedCount === 1;
  }

  async checkAndCreateExpiryAlerts(): Promise<BloodExpiryAlert[]> {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get all inventory expiring within 7 days
    const expiringInventory = await db
      .collection("bloodInventory")
      .find({
        status: { $in: ["available", "limited"] },
        expiryDate: {
          $gte: now,
          $lte: sevenDaysLater,
        },
      })
      .toArray();

    const createdAlerts: BloodExpiryAlert[] = [];

    for (const inventory of expiringInventory) {
      const normalized = normalize<BloodInventory>(inventory);
      if (!normalized) continue;

      // Check if alert already exists for this inventory
      const existingAlert = await db
        .collection("bloodExpiryAlerts")
        .findOne({
          inventoryId: inventory._id.toString(),
          resolved: false,
        });

      if (existingAlert) {
        // Update existing alert
        const daysRemaining = Math.ceil(
          (new Date(normalized.expiryDate).getTime() - now.getTime()) /
            (24 * 60 * 60 * 1000)
        );
        const alertLevel = this.calculateAlertLevel(daysRemaining);

        await db.collection("bloodExpiryAlerts").findOneAndUpdate(
          { _id: existingAlert._id },
          {
            $set: {
              daysRemaining,
              alertLevel,
              updatedAt: now,
            },
          }
        );
        continue;
      }

      // Calculate days remaining
      const daysRemaining = Math.ceil(
        (new Date(normalized.expiryDate).getTime() - now.getTime()) /
          (24 * 60 * 60 * 1000)
      );

      // Determine alert level
      const alertLevel = this.calculateAlertLevel(daysRemaining);

      // Create new alert
      const alert = await this.createBloodExpiryAlert({
        inventoryId: inventory._id.toString(),
        hospitalId: normalized.hospitalId,
        hospitalName: normalized.hospitalName || "Unknown Hospital",
        bloodType: normalized.bloodType,
        quantity: normalized.quantity,
        expiryDate: normalized.expiryDate,
        daysRemaining,
        alertLevel,
        alertSentAt: now,
        emailsSent: [],
        acknowledged: false,
        resolved: false,
      });

      createdAlerts.push(alert);
    }

    return createdAlerts;
  }

  private calculateAlertLevel(daysRemaining: number): "critical" | "warning" | "info" {
    if (daysRemaining <= 1) return "critical";
    if (daysRemaining <= 3) return "warning";
    return "info";
  }

  // ==================== BLOOD DONATION TRACKING METHODS ====================
  async getBloodDonationTracking(id: string): Promise<BloodDonationTracking | undefined> {
    const tracking = await db
      .collection("bloodDonationTracking")
      .findOne({ _id: toObjectId(id) });
    return normalize<BloodDonationTracking>(tracking);
  }

  async getAllBloodDonationTracking(): Promise<BloodDonationTracking[]> {
    const trackings = await db
      .collection("bloodDonationTracking")
      .find({})
      .toArray();
    return normalizeMany<BloodDonationTracking>(trackings);
  }

  async getBloodDonationTrackingByDonor(donorId: string): Promise<BloodDonationTracking[]> {
    const trackings = await db
      .collection("bloodDonationTracking")
      .find({ donorId })
      .sort({ donationDate: -1 })
      .toArray();
    return normalizeMany<BloodDonationTracking>(trackings);
  }

  async getBloodDonationTrackingByReceiver(receiverId: string): Promise<BloodDonationTracking[]> {
    const trackings = await db
      .collection("bloodDonationTracking")
      .find({ receiverId })
      .sort({ donationDate: -1 })
      .toArray();
    return normalizeMany<BloodDonationTracking>(trackings);
  }

  async getBloodDonationTrackingByStatus(status: string): Promise<BloodDonationTracking[]> {
    const trackings = await db
      .collection("bloodDonationTracking")
      .find({ status })
      .sort({ donationDate: -1 })
      .toArray();
    return normalizeMany<BloodDonationTracking>(trackings);
  }

  async getBloodDonationTrackingByHospital(hospitalId: string): Promise<BloodDonationTracking[]> {
    const trackings = await db
      .collection("bloodDonationTracking")
      .find({ hospitalId })
      .sort({ donationDate: -1 })
      .toArray();
    return normalizeMany<BloodDonationTracking>(trackings);
  }

  async createBloodDonationTracking(
    tracking: InsertBloodDonationTracking
  ): Promise<BloodDonationTracking> {
    const now = new Date();
    const document = {
      ...tracking,
      collectionTime: tracking.collectionTime || now,
      trackingNotes: tracking.trackingNotes || [],
      createdAt: now,
      updatedAt: now,
    };
    const result = await db
      .collection("bloodDonationTracking")
      .insertOne(document);
    return normalize<BloodDonationTracking>({
      ...document,
      _id: result.insertedId,
    })!;
  }

  async updateBloodDonationTracking(
    id: string,
    tracking: Partial<InsertBloodDonationTracking>
  ): Promise<BloodDonationTracking | undefined> {
    const cleanTracking = removeUndefined(tracking as Record<string, unknown>);
    const result = await db
      .collection("bloodDonationTracking")
      .findOneAndUpdate(
        { _id: toObjectId(id) },
        {
          $set: {
            ...cleanTracking,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      );
    const updated = (result as any)?.value ?? result ?? null;
    return normalize<BloodDonationTracking>(updated);
  }

  async updateBloodDonationTrackingStatus(
    id: string,
    status: string,
    note?: string,
    updatedBy?: string
  ): Promise<BloodDonationTracking | undefined> {
    const now = new Date();
    const trackingNote = {
      timestamp: now,
      status,
      note: note || `Status updated to ${status}`,
      ...(updatedBy && { updatedBy }),
    };

    const updatePayload: Record<string, unknown> = {
      status,
      updatedAt: now,
    };

    // Set time fields based on status
    if (status === "collected") {
      updatePayload.collectionTime = now;
    } else if (status === "in_transit") {
      updatePayload.transitStartTime = now;
    } else if (status === "received") {
      updatePayload.receivedTime = now;
    } else if (status === "in_use") {
      updatePayload.usageStartTime = now;
    } else if (status === "transfused") {
      updatePayload.transfusionCompleteTime = now;
      updatePayload.isSuccessful = true;
    }

    const result = await db
      .collection("bloodDonationTracking")
      .findOneAndUpdate(
        { _id: toObjectId(id) },
        {
          $set: updatePayload,
          $push: { trackingNotes: trackingNote },
        },
        { returnDocument: "after" }
      );
    const updated = (result as any)?.value ?? result ?? null;
    return normalize<BloodDonationTracking>(updated);
  }

  async deleteBloodDonationTracking(id: string): Promise<boolean> {
    const result = await db
      .collection("bloodDonationTracking")
      .deleteOne({ _id: toObjectId(id) });
    return result.deletedCount === 1;
  }
}

export const storage = new MongoDBStorage();

