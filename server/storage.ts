import bcrypt from "bcryptjs";
import { eq, and, or, ilike, desc, inArray, sql, type SQL, gte, lte } from "drizzle-orm";
import {
  users,
  bloodInventory,
  bloodRequests,
  donors,
  staff,
  receivers,
  bloodExpiryAlerts,
  bloodDonationTracking,
  interHospitalRequests,
  type BloodInventory,
  type BloodRequest,
  type BloodExpiryAlert,
  type BloodDonationTracking,
  type Donor,
  type InsertBloodInventory,
  type InsertBloodRequest,
  type InsertBloodExpiryAlert,
  type InsertBloodDonationTracking,
  type InterHospitalRequest,
  type InsertInterHospitalRequest,
  type InsertDonor,
  type InsertStaff,
  type InsertUser,
  type Staff,
  type User,
} from "@shared/schema";
import { db, isDbConnected } from "./db";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(
    id: string,
    user: Partial<InsertUser & { approvalStatus?: string; rejectionReason?: string }>
  ): Promise<User | undefined>;
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
  getEligibleDonorsWithEmails(
    bloodTypes: string | string[],
    region?: string
  ): Promise<Array<{ donor: Donor; email: string; username: string }>>;
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
  updateBloodExpiryAlert(
    id: string,
    alert: Partial<InsertBloodExpiryAlert>
  ): Promise<BloodExpiryAlert | undefined>;
  acknowledgeBloodExpiryAlert(
    id: string,
    userId: string,
    notes?: string
  ): Promise<BloodExpiryAlert | undefined>;
  resolveBloodExpiryAlert(
    id: string,
    userId: string,
    notes?: string
  ): Promise<BloodExpiryAlert | undefined>;
  deleteBloodExpiryAlert(id: string): Promise<boolean>;
  checkAndCreateExpiryAlerts(): Promise<BloodExpiryAlert[]>;

  // Blood Donation Tracking Methods
  getBloodDonationTracking(id: string): Promise<BloodDonationTracking | undefined>;
  getAllBloodDonationTracking(): Promise<BloodDonationTracking[]>;
  getBloodDonationTrackingByDonor(donorId: string): Promise<BloodDonationTracking[]>;
  getBloodDonationTrackingByReceiver(receiverId: string): Promise<BloodDonationTracking[]>;
  getBloodDonationTrackingByStatus(status: string): Promise<BloodDonationTracking[]>;
  getBloodDonationTrackingByHospital(hospitalId: string): Promise<BloodDonationTracking[]>;
  createBloodDonationTracking(
    tracking: InsertBloodDonationTracking
  ): Promise<BloodDonationTracking>;
  updateBloodDonationTracking(
    id: string,
    tracking: Partial<InsertBloodDonationTracking>
  ): Promise<BloodDonationTracking | undefined>;
  updateBloodDonationTrackingStatus(
    id: string,
    status: string,
    note?: string,
    updatedBy?: string
  ): Promise<BloodDonationTracking | undefined>;
  deleteBloodDonationTracking(id: string): Promise<boolean>;

  // Inter-hospital blood request methods
  getInterHospitalRequest(id: string): Promise<InterHospitalRequest | undefined>;
  getOutgoingInterHospitalRequests(hospitalId: string): Promise<InterHospitalRequest[]>;
  getIncomingInterHospitalRequests(hospitalId: string): Promise<InterHospitalRequest[]>;
  createInterHospitalRequest(
    request: Omit<InsertInterHospitalRequest, "id">
  ): Promise<InterHospitalRequest>;
  updateInterHospitalRequest(
    id: string,
    updates: Partial<InsertInterHospitalRequest>
  ): Promise<InterHospitalRequest | undefined>;
}

const normalize = <T>(doc: any | null | undefined): T | undefined => {
  if (!doc) {
    return undefined;
  }
  const id = doc.id ?? doc._id;
  const normalizedId = id ? String(id) : undefined;
  return {
    ...doc,
    id: normalizedId,
    _id: normalizedId,
  } as T;
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

export class PostgresStorage implements IStorage {
  // In-memory fallback maps for zero-crash development when DB is not connected
  private memUsers = new Map<string, any>();
  private memInventory = new Map<string, any>();
  private memRequests = new Map<string, any>();
  private memDonors = new Map<string, any>();
  private memStaff = new Map<string, any>();
  private memReceivers = new Map<string, any>();
  private memExpiryAlerts = new Map<string, any>();
  private memDonationTracking = new Map<string, any>();
  private memInterHospital = new Map<string, any>();

  // ==================== USER METHODS ====================
  async getUser(id: string): Promise<User | undefined> {
    if (!isDbConnected()) {
      return normalize<User>(this.memUsers.get(id));
    }
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return normalize<User>(user);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const normalized = username.trim().toLowerCase();
    if (!isDbConnected()) {
      for (const u of Array.from(this.memUsers.values())) {
        if (u.username?.trim().toLowerCase() === normalized) {
          return normalize<User>(u);
        }
      }
      return undefined;
    }
    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(TRIM(${users.username})) = ${normalized}`)
      .limit(1);
    return normalize<User>(user);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const normalized = email.trim().toLowerCase();
    if (!isDbConnected()) {
      for (const u of Array.from(this.memUsers.values())) {
        if (u.email?.trim().toLowerCase() === normalized) {
          return normalize<User>(u);
        }
      }
      return undefined;
    }
    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(TRIM(${users.email})) = ${normalized}`)
      .limit(1);
    return normalize<User>(user);
  }

  async getAllUsers(): Promise<User[]> {
    if (!isDbConnected()) {
      return normalizeMany<User>(Array.from(this.memUsers.values()));
    }
    const result = await db.select().from(users);
    return normalizeMany<User>(result);
  }

  async createUser(user: InsertUser): Promise<User> {
    const now = new Date();
    const id = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const document = {
      id,
      username: user.username.trim(),
      email: user.email.trim().toLowerCase(),
      password: hashedPassword,
      role: user.role ?? "donor",
      emailVerified: false,
      emailVerificationCode: null,
      emailVerificationExpiresAt: null,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      approvalStatus: user.approvalStatus ?? null,
      rejectionReason: user.rejectionReason ?? null,
      createdAt: now,
      updatedAt: now,
    };

    if (!isDbConnected()) {
      this.memUsers.set(id, document);
      return normalize<User>(document)!;
    }

    const [created] = await db.insert(users).values(document).returning();
    return normalize<User>(created || document)!;
  }

  async setEmailVerificationCode(
    id: string,
    codeHash: string,
    expiresAt: Date
  ): Promise<User | undefined> {
    const now = new Date();
    if (!isDbConnected()) {
      const user = this.memUsers.get(id);
      if (!user) return undefined;
      user.emailVerificationCode = codeHash;
      user.emailVerificationExpiresAt = expiresAt;
      user.updatedAt = now;
      this.memUsers.set(id, user);
      return normalize<User>(user);
    }
    const [updated] = await db
      .update(users)
      .set({
        emailVerificationCode: codeHash,
        emailVerificationExpiresAt: expiresAt,
        updatedAt: now,
      })
      .where(eq(users.id, id))
      .returning();
    return normalize<User>(updated);
  }

  async markEmailVerified(id: string): Promise<User | undefined> {
    const now = new Date();
    if (!isDbConnected()) {
      const user = this.memUsers.get(id);
      if (!user) return undefined;
      user.emailVerified = true;
      user.emailVerificationCode = null;
      user.emailVerificationExpiresAt = null;
      user.updatedAt = now;
      this.memUsers.set(id, user);
      return normalize<User>(user);
    }
    const [updated] = await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        updatedAt: now,
      })
      .where(eq(users.id, id))
      .returning();
    return normalize<User>(updated);
  }

  async setResetPasswordToken(
    id: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<User | undefined> {
    const now = new Date();
    if (!isDbConnected()) {
      const user = this.memUsers.get(id);
      if (!user) return undefined;
      user.resetPasswordToken = tokenHash;
      user.resetPasswordExpires = expiresAt;
      user.updatedAt = now;
      this.memUsers.set(id, user);
      return normalize<User>(user);
    }
    const [updated] = await db
      .update(users)
      .set({
        resetPasswordToken: tokenHash,
        resetPasswordExpires: expiresAt,
        updatedAt: now,
      })
      .where(eq(users.id, id))
      .returning();
    return normalize<User>(updated);
  }

  async clearResetPasswordToken(id: string): Promise<User | undefined> {
    const now = new Date();
    if (!isDbConnected()) {
      const user = this.memUsers.get(id);
      if (!user) return undefined;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      user.updatedAt = now;
      this.memUsers.set(id, user);
      return normalize<User>(user);
    }
    const [updated] = await db
      .update(users)
      .set({
        resetPasswordToken: null,
        resetPasswordExpires: null,
        updatedAt: now,
      })
      .where(eq(users.id, id))
      .returning();
    return normalize<User>(updated);
  }

  async updateUser(
    id: string,
    user: Partial<InsertUser & { approvalStatus?: string; rejectionReason?: string }>
  ): Promise<User | undefined> {
    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
    };
    if (user.username !== undefined) updatePayload.username = user.username.trim();
    if (user.email !== undefined) updatePayload.email = user.email.trim().toLowerCase();
    if (user.role !== undefined) updatePayload.role = user.role;
    if (user.approvalStatus !== undefined) updatePayload.approvalStatus = user.approvalStatus;
    if (user.rejectionReason !== undefined) updatePayload.rejectionReason = user.rejectionReason;
    if (user.password) updatePayload.password = await bcrypt.hash(user.password, 10);

    if (!isDbConnected()) {
      const existing = this.memUsers.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...updatePayload };
      this.memUsers.set(id, updated);
      return normalize<User>(updated);
    }

    const [updated] = await db
      .update(users)
      .set(updatePayload)
      .where(eq(users.id, id))
      .returning();
    return normalize<User>(updated);
  }

  async deleteUser(id: string): Promise<boolean> {
    if (!isDbConnected()) {
      return this.memUsers.delete(id);
    }
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // ==================== BLOOD INVENTORY METHODS ====================
  async getBloodInventory(id: string): Promise<BloodInventory | undefined> {
    if (!isDbConnected()) {
      return normalize<BloodInventory>(this.memInventory.get(id));
    }
    const [item] = await db
      .select()
      .from(bloodInventory)
      .where(eq(bloodInventory.id, id))
      .limit(1);
    return normalize<BloodInventory>(item);
  }

  async getAllBloodInventory(): Promise<BloodInventory[]> {
    if (!isDbConnected()) {
      return normalizeMany<BloodInventory>(Array.from(this.memInventory.values()));
    }
    const result = await db.select().from(bloodInventory);
    return normalizeMany<BloodInventory>(result);
  }

  async getBloodInventoryByHospital(hospitalId: string): Promise<BloodInventory[]> {
    if (!isDbConnected()) {
      return normalizeMany<BloodInventory>(
        Array.from(this.memInventory.values()).filter(
          (item) => item.hospitalId === hospitalId
        )
      );
    }
    const result = await db
      .select()
      .from(bloodInventory)
      .where(eq(bloodInventory.hospitalId, hospitalId));
    return normalizeMany<BloodInventory>(result);
  }

  async getBloodInventoryByType(bloodType: string): Promise<BloodInventory[]> {
    if (!isDbConnected()) {
      return normalizeMany<BloodInventory>(
        Array.from(this.memInventory.values()).filter(
          (item) => item.bloodType === bloodType && item.status === "available"
        )
      );
    }
    const result = await db
      .select()
      .from(bloodInventory)
      .where(
        and(
          eq(bloodInventory.bloodType, bloodType),
          eq(bloodInventory.status, "available")
        )
      );
    return normalizeMany<BloodInventory>(result);
  }

  async getBloodInventoryExpiringWithin(
    days: number
  ): Promise<Array<BloodInventory & { daysRemaining: number }>> {
    const now = new Date();
    const expiryThreshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    if (!isDbConnected()) {
      const items = Array.from(this.memInventory.values()).filter(
        (item) =>
          ["available", "reserved"].includes(item.status) &&
          new Date(item.expiryDate) >= now &&
          new Date(item.expiryDate) <= expiryThreshold
      );
      return items.map((item) => {
        const daysRemaining = Math.ceil(
          (new Date(item.expiryDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );
        return { ...item, daysRemaining };
      });
    }

    const items = await db
      .select()
      .from(bloodInventory)
      .where(
        and(
          inArray(bloodInventory.status, ["available", "reserved"]),
          gte(bloodInventory.expiryDate, now),
          lte(bloodInventory.expiryDate, expiryThreshold)
        )
      )
      .orderBy(bloodInventory.expiryDate);

    return items
      .map((item) => {
        const normalized = normalize<BloodInventory>(item);
        if (!normalized) return null;
        const daysRemaining = Math.ceil(
          (new Date(normalized.expiryDate).getTime() - now.getTime()) /
            (24 * 60 * 60 * 1000)
        );
        return { ...normalized, daysRemaining };
      })
      .filter((item): item is BloodInventory & { daysRemaining: number } => item !== null);
  }

  async createBloodInventory(
    inventory: InsertBloodInventory
  ): Promise<BloodInventory> {
    const now = new Date();
    const id = crypto.randomUUID();
    const document = {
      id,
      hospitalId: inventory.hospitalId,
      hospitalName: inventory.hospitalName,
      bloodType: inventory.bloodType,
      quantity: inventory.quantity ?? 0,
      expiryDate: new Date(inventory.expiryDate),
      status: inventory.status ?? "available",
      createdAt: now,
      updatedAt: now,
    };

    if (!isDbConnected()) {
      this.memInventory.set(id, document);
      return normalize<BloodInventory>(document)!;
    }

    const [created] = await db.insert(bloodInventory).values(document).returning();
    return normalize<BloodInventory>(created || document)!;
  }

  async updateBloodInventory(
    id: string,
    inventory: Partial<InsertBloodInventory>
  ): Promise<BloodInventory | undefined> {
    const updatePayload = removeUndefined({
      ...inventory,
      ...(inventory.expiryDate ? { expiryDate: new Date(inventory.expiryDate) } : {}),
      updatedAt: new Date(),
    });

    if (!isDbConnected()) {
      const existing = this.memInventory.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...updatePayload };
      this.memInventory.set(id, updated);
      return normalize<BloodInventory>(updated);
    }

    const [updated] = await db
      .update(bloodInventory)
      .set(updatePayload)
      .where(eq(bloodInventory.id, id))
      .returning();
    return normalize<BloodInventory>(updated);
  }

  async deleteBloodInventory(id: string): Promise<boolean> {
    if (!isDbConnected()) {
      return this.memInventory.delete(id);
    }
    const result = await db
      .delete(bloodInventory)
      .where(eq(bloodInventory.id, id))
      .returning();
    return result.length > 0;
  }

  // ==================== BLOOD REQUEST METHODS ====================
  async getBloodRequest(id: string): Promise<BloodRequest | undefined> {
    if (!isDbConnected()) {
      return normalize<BloodRequest>(this.memRequests.get(id));
    }
    const [request] = await db
      .select()
      .from(bloodRequests)
      .where(eq(bloodRequests.id, id))
      .limit(1);
    return normalize<BloodRequest>(request);
  }

  async getAllBloodRequests(): Promise<BloodRequest[]> {
    if (!isDbConnected()) {
      return normalizeMany<BloodRequest>(Array.from(this.memRequests.values()));
    }
    const result = await db
      .select()
      .from(bloodRequests)
      .orderBy(desc(bloodRequests.createdAt));
    return normalizeMany<BloodRequest>(result);
  }

  async getBloodRequestsByStatus(status: string): Promise<BloodRequest[]> {
    if (!isDbConnected()) {
      return normalizeMany<BloodRequest>(
        Array.from(this.memRequests.values()).filter((r) => r.status === status)
      );
    }
    const result = await db
      .select()
      .from(bloodRequests)
      .where(eq(bloodRequests.status, status))
      .orderBy(desc(bloodRequests.createdAt));
    return normalizeMany<BloodRequest>(result);
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
    if (!isDbConnected()) {
      let items = Array.from(this.memRequests.values());
      if (filters.bloodType) items = items.filter((r) => r.bloodType === filters.bloodType);
      if (filters.urgency) items = items.filter((r) => r.urgency === filters.urgency);
      if (filters.status) items = items.filter((r) => r.status === filters.status);
      if (filters.location) {
        const loc = filters.location.toLowerCase();
        items = items.filter(
          (r) =>
            r.hospitalName?.toLowerCase().includes(loc) ||
            r.region?.toLowerCase().includes(loc) ||
            r.address?.toLowerCase().includes(loc)
        );
      }
      if (filters.search) {
        const s = filters.search.toLowerCase();
        items = items.filter(
          (r) =>
            r.hospitalName?.toLowerCase().includes(s) ||
            r.requesterName?.toLowerCase().includes(s) ||
            r.patientName?.toLowerCase().includes(s) ||
            r.bloodType?.toLowerCase().includes(s)
        );
      }
      const total = items.length;
      const skip = pagination?.skip || 0;
      const limit = pagination?.limit || 100;
      const paginated = items.slice(skip, skip + limit);
      return { requests: normalizeMany<BloodRequest>(paginated), total };
    }

    const conditions: SQL[] = [];
    if (filters.bloodType) {
      conditions.push(eq(bloodRequests.bloodType, filters.bloodType));
    }
    if (filters.urgency) {
      conditions.push(eq(bloodRequests.urgency, filters.urgency));
    }
    if (filters.status) {
      conditions.push(eq(bloodRequests.status, filters.status));
    }
    if (filters.location) {
      conditions.push(ilike(bloodRequests.hospitalName, `%${filters.location}%`));
    }
    if (filters.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(bloodRequests.bloodType, searchPattern),
          ilike(bloodRequests.hospitalName, searchPattern),
          ilike(bloodRequests.requesterName, searchPattern),
          ilike(bloodRequests.patientName, searchPattern),
          ilike(bloodRequests.region, searchPattern),
          ilike(bloodRequests.address, searchPattern)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(bloodRequests)
      .where(whereClause);
    const total = countResult?.count ?? 0;

    const results = await db
      .select()
      .from(bloodRequests)
      .where(whereClause)
      .orderBy(desc(bloodRequests.createdAt))
      .offset(pagination?.skip || 0)
      .limit(pagination?.limit || 100);

    return {
      requests: normalizeMany<BloodRequest>(results),
      total,
    };
  }

  async createBloodRequest(request: InsertBloodRequest): Promise<BloodRequest> {
    const now = new Date();
    const id = crypto.randomUUID();
    const document = {
      id,
      ...request,
      createdAt: now,
      updatedAt: now,
    };

    if (!isDbConnected()) {
      this.memRequests.set(id, document);
      return normalize<BloodRequest>(document)!;
    }

    const [created] = await db.insert(bloodRequests).values(document).returning();
    return normalize<BloodRequest>(created || document)!;
  }

  async updateBloodRequest(
    id: string,
    request: Partial<InsertBloodRequest>
  ): Promise<BloodRequest | undefined> {
    const updatePayload = removeUndefined({
      ...request,
      updatedAt: new Date(),
    });

    if (!isDbConnected()) {
      const existing = this.memRequests.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...updatePayload };
      this.memRequests.set(id, updated);
      return normalize<BloodRequest>(updated);
    }

    const [updated] = await db
      .update(bloodRequests)
      .set(updatePayload)
      .where(eq(bloodRequests.id, id))
      .returning();
    return normalize<BloodRequest>(updated);
  }

  async deleteBloodRequest(id: string): Promise<boolean> {
    if (!isDbConnected()) {
      return this.memRequests.delete(id);
    }
    const result = await db
      .delete(bloodRequests)
      .where(eq(bloodRequests.id, id))
      .returning();
    return result.length > 0;
  }

  // ==================== DONOR METHODS ====================
  async getDonor(id: string): Promise<Donor | undefined> {
    if (!isDbConnected()) {
      return normalize<Donor>(this.memDonors.get(id));
    }
    const [donor] = await db.select().from(donors).where(eq(donors.id, id)).limit(1);
    return normalize<Donor>(donor);
  }

  async getAllDonors(): Promise<Donor[]> {
    if (!isDbConnected()) {
      return normalizeMany<Donor>(Array.from(this.memDonors.values()));
    }
    const result = await db.select().from(donors);
    return normalizeMany<Donor>(result);
  }

  async getDonorsByBloodType(bloodType: string): Promise<Donor[]> {
    if (!isDbConnected()) {
      return normalizeMany<Donor>(
        Array.from(this.memDonors.values()).filter((d) => d.bloodType === bloodType)
      );
    }
    const result = await db.select().from(donors).where(eq(donors.bloodType, bloodType));
    return normalizeMany<Donor>(result);
  }

  async getEligibleDonorsWithEmails(
    bloodTypes: string | string[],
    region?: string
  ): Promise<Array<{ donor: Donor; email: string; username: string }>> {
    const types = Array.isArray(bloodTypes) ? bloodTypes : [bloodTypes];

    if (!isDbConnected()) {
      const matchingDonors = Array.from(this.memDonors.values()).filter((d) =>
        types.includes(d.bloodType)
      );
      const result: Array<{ donor: Donor; email: string; username: string }> = [];
      for (const rawDonor of matchingDonors) {
        const donor = normalize<Donor>(rawDonor)!;
        const user = this.memUsers.get(donor.userId);
        const email = user?.email || (rawDonor as any).email;
        const username = user?.username || `${donor.firstName} ${donor.lastName}`;
        if (email) {
          result.push({ donor, email, username });
        }
      }
      return result;
    }

    const donorConditions: SQL[] = [inArray(donors.bloodType, types)];
    if (region) {
      donorConditions.push(eq(donors.region, region));
    }

    const matchingDonors = await db
      .select()
      .from(donors)
      .where(and(...donorConditions));

    if (matchingDonors.length === 0) return [];

    const userIds = matchingDonors.map((d) => d.userId).filter(Boolean);
    const userMap = new Map<string, { email: string; username: string }>();

    if (userIds.length > 0) {
      const userRecords = await db
        .select({ id: users.id, email: users.email, username: users.username })
        .from(users)
        .where(inArray(users.id, userIds));

      for (const u of userRecords) {
        userMap.set(u.id, { email: u.email, username: u.username });
      }
    }

    const result: Array<{ donor: Donor; email: string; username: string }> = [];
    for (const rawDonor of matchingDonors) {
      const donor = normalize<Donor>(rawDonor)!;
      const user = userMap.get(donor.userId);
      const email = user?.email || (rawDonor as any).email;
      const username = user?.username || `${donor.firstName} ${donor.lastName}`;

      if (email) {
        result.push({
          donor,
          email,
          username,
        });
      }
    }

    return result;
  }

  async createDonor(donor: InsertDonor): Promise<Donor> {
    const now = new Date();
    const id = crypto.randomUUID();
    const document = {
      id,
      ...donor,
      eligibilityStatus: donor.eligibilityStatus ?? "eligible",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    if (!isDbConnected()) {
      this.memDonors.set(id, document);
      return normalize<Donor>(document)!;
    }

    const [created] = await db.insert(donors).values(document).returning();
    return normalize<Donor>(created || document)!;
  }

  async updateDonor(
    id: string,
    donor: Partial<InsertDonor>
  ): Promise<Donor | undefined> {
    const updatePayload = removeUndefined({
      ...donor,
      updatedAt: new Date(),
    });

    if (!isDbConnected()) {
      const existing = this.memDonors.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...updatePayload };
      this.memDonors.set(id, updated);
      return normalize<Donor>(updated);
    }

    const [updated] = await db
      .update(donors)
      .set(updatePayload)
      .where(eq(donors.id, id))
      .returning();
    return normalize<Donor>(updated);
  }

  async deleteDonor(id: string): Promise<boolean> {
    if (!isDbConnected()) {
      return this.memDonors.delete(id);
    }
    const result = await db.delete(donors).where(eq(donors.id, id)).returning();
    return result.length > 0;
  }

  // ==================== STAFF METHODS ====================
  async getStaff(id: string): Promise<Staff | undefined> {
    if (!isDbConnected()) {
      return normalize<Staff>(this.memStaff.get(id));
    }
    const [s] = await db.select().from(staff).where(eq(staff.id, id)).limit(1);
    return normalize<Staff>(s);
  }

  async getAllStaff(): Promise<Staff[]> {
    if (!isDbConnected()) {
      return normalizeMany<Staff>(Array.from(this.memStaff.values()));
    }
    const result = await db.select().from(staff);
    return normalizeMany<Staff>(result);
  }

  async createStaff(staffMember: InsertStaff): Promise<Staff> {
    const now = new Date();
    const id = crypto.randomUUID();
    const document = {
      id,
      ...staffMember,
      createdAt: now,
      updatedAt: now,
    };

    if (!isDbConnected()) {
      this.memStaff.set(id, document);
      return normalize<Staff>(document)!;
    }

    const [created] = await db.insert(staff).values(document).returning();
    return normalize<Staff>(created || document)!;
  }

  async updateStaff(
    id: string,
    staffMember: Partial<InsertStaff>
  ): Promise<Staff | undefined> {
    const updatePayload = removeUndefined({
      ...staffMember,
      updatedAt: new Date(),
    });

    if (!isDbConnected()) {
      const existing = this.memStaff.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...updatePayload };
      this.memStaff.set(id, updated);
      return normalize<Staff>(updated);
    }

    const [updated] = await db
      .update(staff)
      .set(updatePayload)
      .where(eq(staff.id, id))
      .returning();
    return normalize<Staff>(updated);
  }

  async deleteStaff(id: string): Promise<boolean> {
    if (!isDbConnected()) {
      return this.memStaff.delete(id);
    }
    const result = await db.delete(staff).where(eq(staff.id, id)).returning();
    return result.length > 0;
  }

  // ==================== RECEIVER METHODS ====================
  async getReceiver(id: string): Promise<any | undefined> {
    if (!isDbConnected()) {
      return normalize<any>(this.memReceivers.get(id));
    }
    const [rec] = await db.select().from(receivers).where(eq(receivers.id, id)).limit(1);
    return normalize<any>(rec);
  }

  async getAllReceivers(): Promise<any[]> {
    if (!isDbConnected()) {
      return normalizeMany<any>(Array.from(this.memReceivers.values()));
    }
    const result = await db.select().from(receivers);
    return normalizeMany<any>(result);
  }

  async getReceiversByBloodType(bloodType: string): Promise<any[]> {
    if (!isDbConnected()) {
      return normalizeMany<any>(
        Array.from(this.memReceivers.values()).filter((r) => r.bloodType === bloodType)
      );
    }
    const result = await db.select().from(receivers).where(eq(receivers.bloodType, bloodType));
    return normalizeMany<any>(result);
  }

  async createReceiver(receiver: any): Promise<any> {
    const now = new Date();
    const id = crypto.randomUUID();
    const document = {
      id,
      ...receiver,
      createdAt: now,
      updatedAt: now,
    };

    if (!isDbConnected()) {
      this.memReceivers.set(id, document);
      return normalize<any>(document)!;
    }

    const [created] = await db.insert(receivers).values(document).returning();
    return normalize<any>(created || document)!;
  }

  async updateReceiver(id: string, receiver: Partial<any>): Promise<any | undefined> {
    const updatePayload = removeUndefined({
      ...receiver,
      updatedAt: new Date(),
    });

    if (!isDbConnected()) {
      const existing = this.memReceivers.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...updatePayload };
      this.memReceivers.set(id, updated);
      return normalize<any>(updated);
    }

    const [updated] = await db
      .update(receivers)
      .set(updatePayload)
      .where(eq(receivers.id, id))
      .returning();
    return normalize<any>(updated);
  }

  async deleteReceiver(id: string): Promise<boolean> {
    if (!isDbConnected()) {
      return this.memReceivers.delete(id);
    }
    const result = await db.delete(receivers).where(eq(receivers.id, id)).returning();
    return result.length > 0;
  }

  // ==================== BLOOD EXPIRY ALERT METHODS ====================
  async getBloodExpiryAlert(id: string): Promise<BloodExpiryAlert | undefined> {
    if (!isDbConnected()) {
      return normalize<BloodExpiryAlert>(this.memExpiryAlerts.get(id));
    }
    const [alert] = await db
      .select()
      .from(bloodExpiryAlerts)
      .where(eq(bloodExpiryAlerts.id, id))
      .limit(1);
    return normalize<BloodExpiryAlert>(alert);
  }

  async getAllBloodExpiryAlerts(): Promise<BloodExpiryAlert[]> {
    if (!isDbConnected()) {
      return normalizeMany<BloodExpiryAlert>(Array.from(this.memExpiryAlerts.values()));
    }
    const result = await db
      .select()
      .from(bloodExpiryAlerts)
      .orderBy(desc(bloodExpiryAlerts.alertSentAt));
    return normalizeMany<BloodExpiryAlert>(result);
  }

  async getBloodExpiryAlertsByHospital(hospitalId: string): Promise<BloodExpiryAlert[]> {
    if (!isDbConnected()) {
      return normalizeMany<BloodExpiryAlert>(
        Array.from(this.memExpiryAlerts.values()).filter(
          (a) => a.hospitalId === hospitalId
        )
      );
    }
    const result = await db
      .select()
      .from(bloodExpiryAlerts)
      .where(eq(bloodExpiryAlerts.hospitalId, hospitalId))
      .orderBy(desc(bloodExpiryAlerts.alertSentAt));
    return normalizeMany<BloodExpiryAlert>(result);
  }

  async getBloodExpiryAlertsByLevel(alertLevel: string): Promise<BloodExpiryAlert[]> {
    if (!isDbConnected()) {
      return normalizeMany<BloodExpiryAlert>(
        Array.from(this.memExpiryAlerts.values()).filter(
          (a) => a.alertLevel === alertLevel
        )
      );
    }
    const result = await db
      .select()
      .from(bloodExpiryAlerts)
      .where(eq(bloodExpiryAlerts.alertLevel, alertLevel))
      .orderBy(desc(bloodExpiryAlerts.alertSentAt));
    return normalizeMany<BloodExpiryAlert>(result);
  }

  async getActiveBloodExpiryAlerts(resolved = false): Promise<BloodExpiryAlert[]> {
    if (!isDbConnected()) {
      return normalizeMany<BloodExpiryAlert>(
        Array.from(this.memExpiryAlerts.values()).filter((a) => a.resolved === resolved)
      );
    }
    const result = await db
      .select()
      .from(bloodExpiryAlerts)
      .where(eq(bloodExpiryAlerts.resolved, resolved))
      .orderBy(desc(bloodExpiryAlerts.alertSentAt));
    return normalizeMany<BloodExpiryAlert>(result);
  }

  async createBloodExpiryAlert(
    alert: InsertBloodExpiryAlert
  ): Promise<BloodExpiryAlert> {
    const now = new Date();
    const id = crypto.randomUUID();
    const document = {
      id,
      ...alert,
      expiryDate: new Date(alert.expiryDate),
      alertSentAt: alert.alertSentAt ? new Date(alert.alertSentAt) : now,
      acknowledgedAt: alert.acknowledgedAt ? new Date(alert.acknowledgedAt) : null,
      resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : null,
      emailsSent: alert.emailsSent ?? [],
      createdAt: now,
      updatedAt: now,
    };

    if (!isDbConnected()) {
      this.memExpiryAlerts.set(id, document);
      return normalize<BloodExpiryAlert>(document)!;
    }

    const [created] = await db.insert(bloodExpiryAlerts).values(document).returning();
    return normalize<BloodExpiryAlert>(created || document)!;
  }

  async updateBloodExpiryAlert(
    id: string,
    alert: Partial<InsertBloodExpiryAlert>
  ): Promise<BloodExpiryAlert | undefined> {
    const updatePayload = removeUndefined({
      ...alert,
      ...(alert.expiryDate ? { expiryDate: new Date(alert.expiryDate) } : {}),
      ...(alert.alertSentAt ? { alertSentAt: new Date(alert.alertSentAt) } : {}),
      ...(alert.acknowledgedAt ? { acknowledgedAt: new Date(alert.acknowledgedAt) } : {}),
      ...(alert.resolvedAt ? { resolvedAt: new Date(alert.resolvedAt) } : {}),
      updatedAt: new Date(),
    });

    if (!isDbConnected()) {
      const existing = this.memExpiryAlerts.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...updatePayload };
      this.memExpiryAlerts.set(id, updated);
      return normalize<BloodExpiryAlert>(updated);
    }

    const [updated] = await db
      .update(bloodExpiryAlerts)
      .set(updatePayload)
      .where(eq(bloodExpiryAlerts.id, id))
      .returning();
    return normalize<BloodExpiryAlert>(updated);
  }

  async acknowledgeBloodExpiryAlert(
    id: string,
    userId: string,
    notes?: string
  ): Promise<BloodExpiryAlert | undefined> {
    const now = new Date();
    const updatePayload = {
      acknowledged: true,
      acknowledgedBy: userId,
      acknowledgedAt: now,
      ...(notes ? { acknowledgedNotes: notes } : {}),
      updatedAt: now,
    };

    if (!isDbConnected()) {
      const existing = this.memExpiryAlerts.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...updatePayload };
      this.memExpiryAlerts.set(id, updated);
      return normalize<BloodExpiryAlert>(updated);
    }

    const [updated] = await db
      .update(bloodExpiryAlerts)
      .set(updatePayload)
      .where(eq(bloodExpiryAlerts.id, id))
      .returning();
    return normalize<BloodExpiryAlert>(updated);
  }

  async resolveBloodExpiryAlert(
    id: string,
    userId: string,
    notes?: string
  ): Promise<BloodExpiryAlert | undefined> {
    const now = new Date();
    const updatePayload = {
      resolved: true,
      resolvedBy: userId,
      resolvedAt: now,
      ...(notes ? { resolvedNotes: notes } : {}),
      updatedAt: now,
    };

    if (!isDbConnected()) {
      const existing = this.memExpiryAlerts.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...updatePayload };
      this.memExpiryAlerts.set(id, updated);
      return normalize<BloodExpiryAlert>(updated);
    }

    const [updated] = await db
      .update(bloodExpiryAlerts)
      .set(updatePayload)
      .where(eq(bloodExpiryAlerts.id, id))
      .returning();
    return normalize<BloodExpiryAlert>(updated);
  }

  async deleteBloodExpiryAlert(id: string): Promise<boolean> {
    if (!isDbConnected()) {
      return this.memExpiryAlerts.delete(id);
    }
    const result = await db
      .delete(bloodExpiryAlerts)
      .where(eq(bloodExpiryAlerts.id, id))
      .returning();
    return result.length > 0;
  }

  async checkAndCreateExpiryAlerts(): Promise<BloodExpiryAlert[]> {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const expiringInventory = await (async () => {
      if (!isDbConnected()) {
        return Array.from(this.memInventory.values()).filter(
          (item) =>
            ["available", "limited"].includes(item.status) &&
            new Date(item.expiryDate) >= now &&
            new Date(item.expiryDate) <= sevenDaysLater
        );
      }
      return await db
        .select()
        .from(bloodInventory)
        .where(
          and(
            inArray(bloodInventory.status, ["available", "limited"]),
            gte(bloodInventory.expiryDate, now),
            lte(bloodInventory.expiryDate, sevenDaysLater)
          )
        );
    })();

    const createdAlerts: BloodExpiryAlert[] = [];

    for (const inventoryItem of expiringInventory) {
      const normalized = normalize<BloodInventory>(inventoryItem);
      if (!normalized) continue;

      const daysRemaining = Math.ceil(
        (new Date(normalized.expiryDate).getTime() - now.getTime()) /
          (24 * 60 * 60 * 1000)
      );
      const alertLevel = this.calculateAlertLevel(daysRemaining);

      const existingAlert = await (async () => {
        if (!isDbConnected()) {
          return Array.from(this.memExpiryAlerts.values()).find(
            (a) => a.inventoryId === normalized.id && !a.resolved
          );
        }
        const [found] = await db
          .select()
          .from(bloodExpiryAlerts)
          .where(
            and(
              eq(bloodExpiryAlerts.inventoryId, normalized.id),
              eq(bloodExpiryAlerts.resolved, false)
            )
          )
          .limit(1);
        return found;
      })();

      if (existingAlert) {
        await this.updateBloodExpiryAlert(existingAlert.id, {
          daysRemaining,
          alertLevel,
        });
        continue;
      }

      const alert = await this.createBloodExpiryAlert({
        inventoryId: normalized.id,
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
    if (!isDbConnected()) {
      return normalize<BloodDonationTracking>(this.memDonationTracking.get(id));
    }
    const [t] = await db
      .select()
      .from(bloodDonationTracking)
      .where(eq(bloodDonationTracking.id, id))
      .limit(1);
    return normalize<BloodDonationTracking>(t);
  }

  async getAllBloodDonationTracking(): Promise<BloodDonationTracking[]> {
    if (!isDbConnected()) {
      return normalizeMany<BloodDonationTracking>(
        Array.from(this.memDonationTracking.values())
      );
    }
    const result = await db
      .select()
      .from(bloodDonationTracking)
      .orderBy(desc(bloodDonationTracking.donationDate));
    return normalizeMany<BloodDonationTracking>(result);
  }

  async getBloodDonationTrackingByDonor(donorId: string): Promise<BloodDonationTracking[]> {
    if (!isDbConnected()) {
      return normalizeMany<BloodDonationTracking>(
        Array.from(this.memDonationTracking.values()).filter((t) => t.donorId === donorId)
      );
    }
    const result = await db
      .select()
      .from(bloodDonationTracking)
      .where(eq(bloodDonationTracking.donorId, donorId))
      .orderBy(desc(bloodDonationTracking.donationDate));
    return normalizeMany<BloodDonationTracking>(result);
  }

  async getBloodDonationTrackingByReceiver(
    receiverId: string
  ): Promise<BloodDonationTracking[]> {
    if (!isDbConnected()) {
      return normalizeMany<BloodDonationTracking>(
        Array.from(this.memDonationTracking.values()).filter(
          (t) => t.receiverId === receiverId
        )
      );
    }
    const result = await db
      .select()
      .from(bloodDonationTracking)
      .where(eq(bloodDonationTracking.receiverId, receiverId))
      .orderBy(desc(bloodDonationTracking.donationDate));
    return normalizeMany<BloodDonationTracking>(result);
  }

  async getBloodDonationTrackingByStatus(status: string): Promise<BloodDonationTracking[]> {
    if (!isDbConnected()) {
      return normalizeMany<BloodDonationTracking>(
        Array.from(this.memDonationTracking.values()).filter((t) => t.status === status)
      );
    }
    const result = await db
      .select()
      .from(bloodDonationTracking)
      .where(eq(bloodDonationTracking.status, status))
      .orderBy(desc(bloodDonationTracking.donationDate));
    return normalizeMany<BloodDonationTracking>(result);
  }

  async getBloodDonationTrackingByHospital(
    hospitalId: string
  ): Promise<BloodDonationTracking[]> {
    if (!isDbConnected()) {
      return normalizeMany<BloodDonationTracking>(
        Array.from(this.memDonationTracking.values()).filter(
          (t) => t.hospitalId === hospitalId
        )
      );
    }
    const result = await db
      .select()
      .from(bloodDonationTracking)
      .where(eq(bloodDonationTracking.hospitalId, hospitalId))
      .orderBy(desc(bloodDonationTracking.donationDate));
    return normalizeMany<BloodDonationTracking>(result);
  }

  async createBloodDonationTracking(
    tracking: InsertBloodDonationTracking
  ): Promise<BloodDonationTracking> {
    const now = new Date();
    const id = crypto.randomUUID();
    const document = {
      id,
      ...tracking,
      donationDate: tracking.donationDate ? new Date(tracking.donationDate) : now,
      collectionTime: tracking.collectionTime ? new Date(tracking.collectionTime) : now,
      transitStartTime: tracking.transitStartTime ? new Date(tracking.transitStartTime) : null,
      receivedTime: tracking.receivedTime ? new Date(tracking.receivedTime) : null,
      usageStartTime: tracking.usageStartTime ? new Date(tracking.usageStartTime) : null,
      transfusionCompleteTime: tracking.transfusionCompleteTime
        ? new Date(tracking.transfusionCompleteTime)
        : null,
      trackingNotes: tracking.trackingNotes || [],
      createdAt: now,
      updatedAt: now,
    };

    if (!isDbConnected()) {
      this.memDonationTracking.set(id, document);
      return normalize<BloodDonationTracking>(document)!;
    }

    const [created] = await db
      .insert(bloodDonationTracking)
      .values(document)
      .returning();
    return normalize<BloodDonationTracking>(created || document)!;
  }

  async updateBloodDonationTracking(
    id: string,
    tracking: Partial<InsertBloodDonationTracking>
  ): Promise<BloodDonationTracking | undefined> {
    const cleanTracking = removeUndefined({
      ...tracking,
      ...(tracking.donationDate ? { donationDate: new Date(tracking.donationDate) } : {}),
      ...(tracking.collectionTime ? { collectionTime: new Date(tracking.collectionTime) } : {}),
      ...(tracking.transitStartTime ? { transitStartTime: new Date(tracking.transitStartTime) } : {}),
      ...(tracking.receivedTime ? { receivedTime: new Date(tracking.receivedTime) } : {}),
      ...(tracking.usageStartTime ? { usageStartTime: new Date(tracking.usageStartTime) } : {}),
      ...(tracking.transfusionCompleteTime
        ? { transfusionCompleteTime: new Date(tracking.transfusionCompleteTime) }
        : {}),
      updatedAt: new Date(),
    });

    if (!isDbConnected()) {
      const existing = this.memDonationTracking.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...cleanTracking };
      this.memDonationTracking.set(id, updated);
      return normalize<BloodDonationTracking>(updated);
    }

    const [updated] = await db
      .update(bloodDonationTracking)
      .set(cleanTracking)
      .where(eq(bloodDonationTracking.id, id))
      .returning();
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
      ...(updatedBy ? { updatedBy } : {}),
    };

    const updatePayload: Record<string, any> = {
      status,
      updatedAt: now,
    };

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

    if (!isDbConnected()) {
      const existing = this.memDonationTracking.get(id);
      if (!existing) return undefined;
      const currentNotes = existing.trackingNotes || [];
      const updated = {
        ...existing,
        ...updatePayload,
        trackingNotes: [...currentNotes, trackingNote],
      };
      this.memDonationTracking.set(id, updated);
      return normalize<BloodDonationTracking>(updated);
    }

    const currentRecord = await this.getBloodDonationTracking(id);
    const currentNotes = currentRecord?.trackingNotes || [];
    updatePayload.trackingNotes = [...currentNotes, trackingNote];

    const [updated] = await db
      .update(bloodDonationTracking)
      .set(updatePayload)
      .where(eq(bloodDonationTracking.id, id))
      .returning();
    return normalize<BloodDonationTracking>(updated);
  }

  async deleteBloodDonationTracking(id: string): Promise<boolean> {
    if (!isDbConnected()) {
      return this.memDonationTracking.delete(id);
    }
    const result = await db
      .delete(bloodDonationTracking)
      .where(eq(bloodDonationTracking.id, id))
      .returning();
    return result.length > 0;
  }

  // ==================== INTER-HOSPITAL REQUEST METHODS ====================
  async getInterHospitalRequest(id: string): Promise<InterHospitalRequest | undefined> {
    if (!isDbConnected()) {
      return normalize<InterHospitalRequest>(this.memInterHospital.get(id));
    }
    const [request] = await db
      .select()
      .from(interHospitalRequests)
      .where(eq(interHospitalRequests.id, id))
      .limit(1);
    return normalize<InterHospitalRequest>(request);
  }

  async getOutgoingInterHospitalRequests(hospitalId: string): Promise<InterHospitalRequest[]> {
    if (!isDbConnected()) {
      return normalizeMany<InterHospitalRequest>(
        Array.from(this.memInterHospital.values())
          .filter((r) => r.requestingHospitalId === hospitalId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      );
    }
    const result = await db
      .select()
      .from(interHospitalRequests)
      .where(eq(interHospitalRequests.requestingHospitalId, hospitalId))
      .orderBy(desc(interHospitalRequests.createdAt));
    return normalizeMany<InterHospitalRequest>(result);
  }

  // Incoming = requests from other hospitals that are still open to anyone,
  // or that this hospital has already responded to.
  async getIncomingInterHospitalRequests(hospitalId: string): Promise<InterHospitalRequest[]> {
    if (!isDbConnected()) {
      return normalizeMany<InterHospitalRequest>(
        Array.from(this.memInterHospital.values())
          .filter(
            (r) =>
              r.requestingHospitalId !== hospitalId &&
              (r.status === "pending" || r.providingHospitalId === hospitalId)
          )
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      );
    }
    const result = await db
      .select()
      .from(interHospitalRequests)
      .where(
        and(
          sql`${interHospitalRequests.requestingHospitalId} <> ${hospitalId}`,
          or(
            eq(interHospitalRequests.status, "pending"),
            eq(interHospitalRequests.providingHospitalId, hospitalId)
          )
        )
      )
      .orderBy(desc(interHospitalRequests.createdAt));
    return normalizeMany<InterHospitalRequest>(result);
  }

  async createInterHospitalRequest(
    request: Omit<InsertInterHospitalRequest, "id">
  ): Promise<InterHospitalRequest> {
    const now = new Date();
    const id = crypto.randomUUID();
    const document = {
      ...request,
      id,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    if (!isDbConnected()) {
      this.memInterHospital.set(id, document);
      return normalize<InterHospitalRequest>(document)!;
    }

    const [created] = await db.insert(interHospitalRequests).values(document).returning();
    return normalize<InterHospitalRequest>(created || document)!;
  }

  async updateInterHospitalRequest(
    id: string,
    updates: Partial<InsertInterHospitalRequest>
  ): Promise<InterHospitalRequest | undefined> {
    const updatePayload = removeUndefined({
      ...updates,
      id: undefined,
      updatedAt: new Date(),
    });

    if (!isDbConnected()) {
      const existing = this.memInterHospital.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...updatePayload };
      this.memInterHospital.set(id, updated);
      return normalize<InterHospitalRequest>(updated);
    }

    const [updated] = await db
      .update(interHospitalRequests)
      .set(updatePayload)
      .where(eq(interHospitalRequests.id, id))
      .returning();
    return normalize<InterHospitalRequest>(updated);
  }
}

export const storage = new PostgresStorage();
