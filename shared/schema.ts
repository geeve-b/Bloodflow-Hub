import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  jsonb,
} from "drizzle-orm/pg-core";
import { z } from "zod";

// ==================== USERS TABLE & SCHEMA ====================
export const users = pgTable("users", {
  id: varchar("id", { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  emailVerificationCode: text("email_verification_code"),
  emailVerificationExpiresAt: timestamp("email_verification_expires_at"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  role: varchar("role", { length: 32 }).default("donor").notNull(),
  approvalStatus: varchar("approval_status", { length: 32 }),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email(),
  emailVerified: z.boolean().default(false),
  emailVerificationCode: z.string().nullable().optional(),
  emailVerificationExpiresAt: z.date().nullable().optional(),
  resetPasswordToken: z.string().nullable().optional(),
  resetPasswordExpires: z.date().nullable().optional(),
  role: z.enum(["donor", "hospital", "admin", "receiver"]).default("donor"),
  approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
  rejectionReason: z.string().nullable().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email(),
  role: z.enum(["donor", "hospital", "admin", "receiver"]).default("donor"),
  approvalStatus: z.string().optional(),
  rejectionReason: z.string().optional(),
});

// ==================== BLOOD INVENTORY TABLE & SCHEMA ====================
export const bloodInventory = pgTable("blood_inventory", {
  id: varchar("id", { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  hospitalId: varchar("hospital_id", { length: 64 }).notNull(),
  hospitalName: text("hospital_name").notNull(),
  bloodType: varchar("blood_type", { length: 8 }).notNull(),
  quantity: integer("quantity").default(0).notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  status: varchar("status", { length: 32 }).default("available").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bloodInventorySchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  hospitalId: z.string(),
  hospitalName: z.string(),
  bloodType: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  quantity: z.number().min(0, "Quantity cannot be negative"),
  expiryDate: z.coerce.date(),
  status: z.enum(["available", "limited", "not_available"]).default("available"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertBloodInventorySchema = bloodInventorySchema.pick({
  hospitalId: true,
  hospitalName: true,
  bloodType: true,
  quantity: true,
  expiryDate: true,
  status: true,
});

// ==================== BLOOD REQUEST TABLE & SCHEMA ====================
export const bloodRequests = pgTable("blood_requests", {
  id: varchar("id", { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  requesterId: varchar("requester_id", { length: 64 }).notNull(),
  requesterName: text("requester_name").notNull(),
  hospitalName: text("hospital_name").notNull(),
  hospitalLatitude: doublePrecision("hospital_latitude"),
  hospitalLongitude: doublePrecision("hospital_longitude"),
  region: text("region").notNull(),
  address: text("address").notNull(),
  country: text("country"),
  state: text("state"),
  bloodType: varchar("blood_type", { length: 8 }).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  urgency: varchar("urgency", { length: 32 }).default("normal").notNull(),
  patientName: text("patient_name").notNull(),
  contactNumber: varchar("contact_number", { length: 64 }).notNull(),
  secondaryContactNumber: varchar("secondary_contact_number", { length: 64 }),
  reason: text("reason"),
  status: varchar("status", { length: 32 }).default("pending").notNull(),
  approvedByHospitalId: varchar("approved_by_hospital_id", { length: 64 }),
  approvedByHospitalName: text("approved_by_hospital_name"),
  priorityScore: doublePrecision("priority_score").default(0.5),
  rejectionReason: text("rejection_reason"),
  fulfilledByHospitalId: varchar("fulfilled_by_hospital_id", { length: 64 }),
  fulfilledByHospitalName: text("fulfilled_by_hospital_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bloodRequestSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  requesterId: z.string(),
  requesterName: z.string(),
  hospitalName: z.string(),
  hospitalLatitude: z.number().min(-90).max(90).optional().nullable(),
  hospitalLongitude: z.number().min(-180).max(180).optional().nullable(),
  region: z.string().min(1, "Region is required"),
  address: z.string().min(1, "Address is required"),
  country: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  bloodType: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  urgency: z.enum(["critical", "normal"]).default("normal"),
  patientName: z.string().min(1, "Patient name is required"),
  contactNumber: z.string().min(6, "Primary contact number is required"),
  secondaryContactNumber: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
  status: z.enum(["pending", "approved", "fulfilled", "rejected"]).default("pending"),
  approvedByHospitalId: z.string().optional().nullable(),
  approvedByHospitalName: z.string().optional().nullable(),
  priorityScore: z.number().min(0).max(1).default(0.5).optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  fulfilledByHospitalId: z.string().optional().nullable(),
  fulfilledByHospitalName: z.string().optional().nullable(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertBloodRequestSchema = bloodRequestSchema.pick({
  requesterId: true,
  requesterName: true,
  hospitalName: true,
  region: true,
  address: true,
  bloodType: true,
  quantity: true,
  urgency: true,
  patientName: true,
  contactNumber: true,
  secondaryContactNumber: true,
  reason: true,
  status: true,
  country: true,
  state: true,
  hospitalLatitude: true,
  hospitalLongitude: true,
  priorityScore: true,
  rejectionReason: true,
  approvedByHospitalId: true,
  approvedByHospitalName: true,
  fulfilledByHospitalId: true,
  fulfilledByHospitalName: true,
});

// ==================== DONOR TABLE & SCHEMA ====================
export const donors = pgTable("donors", {
  id: varchar("id", { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 64 }).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  bloodType: varchar("blood_type", { length: 8 }).notNull(),
  phone: varchar("phone", { length: 64 }).notNull(),
  address: text("address").notNull(),
  state: text("state"),
  region: text("region"),
  lastDonationDate: timestamp("last_donation_date"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  availabilityWindows: jsonb("availability_windows").$type<
    Array<{ start: string; end: string }>
  >(),
  eligibilityStatus: varchar("eligibility_status", { length: 32 })
    .default("eligible")
    .notNull(),
  eligibilityNotes: jsonb("eligibility_notes").$type<string[]>(),
  deferralUntil: timestamp("deferral_until"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const donorSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  userId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  bloodType: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  phone: z.string(),
  address: z.string(),
  state: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  lastDonationDate: z.date().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  availabilityWindows: z
    .array(
      z.object({
        start: z.string(),
        end: z.string(),
      })
    )
    .optional()
    .nullable(),
  eligibilityStatus: z
    .enum(["eligible", "temporarily_ineligible", "permanently_ineligible"])
    .default("eligible"),
  eligibilityNotes: z.array(z.string()).optional().nullable(),
  deferralUntil: z.date().optional().nullable(),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertDonorSchema = donorSchema.pick({
  userId: true,
  firstName: true,
  lastName: true,
  bloodType: true,
  phone: true,
  address: true,
  state: true,
  region: true,
  latitude: true,
  longitude: true,
  availabilityWindows: true,
  eligibilityStatus: true,
  eligibilityNotes: true,
  deferralUntil: true,
});

// ==================== STAFF TABLE & SCHEMA ====================
export const staff = pgTable("staff", {
  id: varchar("id", { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 64 }).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  staffId: varchar("staff_id", { length: 64 }).notNull(),
  department: text("department").notNull(),
  position: text("position").notNull(),
  phone: varchar("phone", { length: 64 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  hospitalName: text("hospital_name").notNull(),
  staff_id_document: text("staff_id_document"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const staffSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  userId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  staffId: z.string(),
  department: z.string(),
  position: z.string(),
  phone: z.string(),
  email: z.string().email(),
  hospitalName: z.string(),
  staff_id_document: z.string().optional().nullable(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertStaffSchema = staffSchema.pick({
  userId: true,
  firstName: true,
  lastName: true,
  staffId: true,
  department: true,
  position: true,
  phone: true,
  email: true,
  hospitalName: true,
  staff_id_document: true,
});

// ==================== RECEIVER TABLE & SCHEMA ====================
export const receivers = pgTable("receivers", {
  id: varchar("id", { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 64 }).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  bloodType: varchar("blood_type", { length: 8 }).notNull(),
  phone: varchar("phone", { length: 64 }).notNull(),
  address: text("address").notNull(),
  hospitalName: text("hospital_name").notNull(),
  medicalCondition: text("medical_condition"),
  urgencyLevel: varchar("urgency_level", { length: 32 }).default("normal").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const receiverSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  userId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  bloodType: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  phone: z.string(),
  address: z.string(),
  hospitalName: z.string(),
  medicalCondition: z.string().optional().nullable(),
  urgencyLevel: z.enum(["critical", "normal"]).default("normal"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertReceiverSchema = receiverSchema.pick({
  userId: true,
  firstName: true,
  lastName: true,
  bloodType: true,
  phone: true,
  address: true,
  hospitalName: true,
  medicalCondition: true,
  urgencyLevel: true,
});

// ==================== DONOR RESPONSE TABLE & SCHEMA ====================
export const donorResponses = pgTable("donor_responses", {
  id: varchar("id", { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  requestId: varchar("request_id", { length: 64 }).notNull(),
  donorId: varchar("donor_id", { length: 64 }).notNull(),
  donorEmail: varchar("donor_email", { length: 255 }).notNull(),
  donorName: text("donor_name").notNull(),
  token: text("token").notNull(),
  response: varchar("response", { length: 32 }).default("pending").notNull(),
  respondedAt: timestamp("responded_at"),
  tokenExpiresAt: timestamp("token_expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const donorResponseSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  requestId: z.string(),
  donorId: z.string(),
  donorEmail: z.string().email(),
  donorName: z.string(),
  token: z.string(),
  response: z.enum(["accepted", "declined", "pending"]).default("pending"),
  respondedAt: z.date().optional().nullable(),
  tokenExpiresAt: z.date(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertDonorResponseSchema = donorResponseSchema.pick({
  requestId: true,
  donorId: true,
  donorEmail: true,
  donorName: true,
  token: true,
  tokenExpiresAt: true,
});

// ==================== BLOOD EXPIRY ALERT TABLE & SCHEMA ====================
export const bloodExpiryAlerts = pgTable("blood_expiry_alerts", {
  id: varchar("id", { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  inventoryId: varchar("inventory_id", { length: 64 }).notNull(),
  hospitalId: varchar("hospital_id", { length: 64 }).notNull(),
  hospitalName: text("hospital_name").notNull(),
  bloodType: varchar("blood_type", { length: 8 }).notNull(),
  quantity: integer("quantity").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  daysRemaining: integer("days_remaining").notNull(),
  alertLevel: varchar("alert_level", { length: 32 }).notNull(),
  alertSentAt: timestamp("alert_sent_at").defaultNow().notNull(),
  emailsSent: jsonb("emails_sent")
    .$type<Array<{ email: string; staffName: string; sentAt: Date | string }>>()
    .default([]),
  acknowledged: boolean("acknowledged").default(false).notNull(),
  acknowledgedBy: varchar("acknowledged_by", { length: 64 }),
  acknowledgedAt: timestamp("acknowledged_at"),
  acknowledgedNotes: text("acknowledged_notes"),
  resolved: boolean("resolved").default(false).notNull(),
  resolvedBy: varchar("resolved_by", { length: 64 }),
  resolvedAt: timestamp("resolved_at"),
  resolvedNotes: text("resolved_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bloodExpiryAlertSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  inventoryId: z.string(),
  hospitalId: z.string(),
  hospitalName: z.string(),
  bloodType: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  quantity: z.number().min(0),
  expiryDate: z.date(),
  daysRemaining: z.number().min(0),
  alertLevel: z.enum(["critical", "warning", "info"]),
  alertSentAt: z.date(),
  emailsSent: z
    .array(
      z.object({
        email: z.string().email(),
        staffName: z.string(),
        sentAt: z.date().or(z.string()),
      })
    )
    .default([]),
  acknowledged: z.boolean().default(false),
  acknowledgedBy: z.string().optional().nullable(),
  acknowledgedAt: z.date().optional().nullable(),
  acknowledgedNotes: z.string().optional().nullable(),
  resolved: z.boolean().default(false),
  resolvedBy: z.string().optional().nullable(),
  resolvedAt: z.date().optional().nullable(),
  resolvedNotes: z.string().optional().nullable(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertBloodExpiryAlertSchema = bloodExpiryAlertSchema.pick({
  inventoryId: true,
  hospitalId: true,
  hospitalName: true,
  bloodType: true,
  quantity: true,
  expiryDate: true,
  daysRemaining: true,
  alertLevel: true,
  alertSentAt: true,
  emailsSent: true,
  acknowledged: true,
  acknowledgedBy: true,
  acknowledgedAt: true,
  acknowledgedNotes: true,
  resolved: true,
  resolvedBy: true,
  resolvedAt: true,
  resolvedNotes: true,
});

// ==================== BLOOD DONATION TRACKING TABLE & SCHEMA ====================
export const bloodDonationTracking = pgTable("blood_donation_tracking", {
  id: varchar("id", { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  donorId: varchar("donor_id", { length: 64 }).notNull(),
  donorName: text("donor_name").notNull(),
  donorEmail: varchar("donor_email", { length: 255 }).notNull(),
  bloodType: varchar("blood_type", { length: 8 }).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  donationDate: timestamp("donation_date").defaultNow().notNull(),
  hospitalId: varchar("hospital_id", { length: 64 }).notNull(),
  hospitalName: text("hospital_name").notNull(),
  receiverId: varchar("receiver_id", { length: 64 }),
  receiverName: text("receiver_name"),
  receiverHospitalName: text("receiver_hospital_name"),
  medicalCondition: text("medical_condition"),
  urgencyLevel: varchar("urgency_level", { length: 32 }).default("normal"),
  status: varchar("status", { length: 32 }).default("collected").notNull(),
  collectionTime: timestamp("collection_time"),
  transitStartTime: timestamp("transit_start_time"),
  receivedTime: timestamp("received_time"),
  usageStartTime: timestamp("usage_start_time"),
  transfusionCompleteTime: timestamp("transfusion_complete_time"),
  trackingNotes: jsonb("tracking_notes")
    .$type<
      Array<{
        timestamp: Date | string;
        status: string;
        note: string;
        updatedBy?: string;
      }>
    >()
    .default([]),
  isSuccessful: boolean("is_successful"),
  outcomeNotes: text("outcome_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bloodDonationTrackingSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  donorId: z.string(),
  donorName: z.string(),
  donorEmail: z.string().email(),
  bloodType: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  quantity: z.number().min(1),
  donationDate: z.date(),
  hospitalId: z.string(),
  hospitalName: z.string(),
  receiverId: z.string().optional().nullable(),
  receiverName: z.string().optional().nullable(),
  receiverHospitalName: z.string().optional().nullable(),
  medicalCondition: z.string().optional().nullable(),
  urgencyLevel: z.enum(["critical", "normal"]).default("normal"),
  status: z
    .enum([
      "collected",
      "in_transit",
      "received",
      "in_use",
      "transfused",
      "expired",
      "discarded",
    ])
    .default("collected"),
  collectionTime: z.date().optional().nullable(),
  transitStartTime: z.date().optional().nullable(),
  receivedTime: z.date().optional().nullable(),
  usageStartTime: z.date().optional().nullable(),
  transfusionCompleteTime: z.date().optional().nullable(),
  trackingNotes: z
    .array(
      z.object({
        timestamp: z.date().or(z.string()),
        status: z.string(),
        note: z.string(),
        updatedBy: z.string().optional().nullable(),
      })
    )
    .default([]),
  isSuccessful: z.boolean().optional().nullable(),
  outcomeNotes: z.string().optional().nullable(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertBloodDonationTrackingSchema = bloodDonationTrackingSchema.pick({
  donorId: true,
  donorName: true,
  donorEmail: true,
  bloodType: true,
  quantity: true,
  donationDate: true,
  hospitalId: true,
  hospitalName: true,
  receiverId: true,
  receiverName: true,
  receiverHospitalName: true,
  medicalCondition: true,
  urgencyLevel: true,
  status: true,
  collectionTime: true,
  transitStartTime: true,
  receivedTime: true,
  usageStartTime: true,
  transfusionCompleteTime: true,
  trackingNotes: true,
  isSuccessful: true,
  outcomeNotes: true,
});

// ==================== INTER-HOSPITAL BLOOD REQUEST TABLE & SCHEMA ====================
export const interHospitalRequests = pgTable("inter_hospital_requests", {
  id: varchar("id", { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  requestingHospitalId: varchar("requesting_hospital_id", { length: 64 }).notNull(),
  requestingHospitalName: text("requesting_hospital_name").notNull(),
  requestingHospitalLocation: text("requesting_hospital_location"),
  requestingHospitalPhone: varchar("requesting_hospital_phone", { length: 64 }),
  providingHospitalId: varchar("providing_hospital_id", { length: 64 }),
  providingHospitalName: text("providing_hospital_name"),
  bloodType: varchar("blood_type", { length: 8 }).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  urgency: varchar("urgency", { length: 32 }).default("normal").notNull(),
  reason: text("reason"),
  status: varchar("status", { length: 32 }).default("pending").notNull(),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInterHospitalRequestSchema = z.object({
  requestingHospitalId: z.string().min(1),
  requestingHospitalName: z.string().min(1),
  requestingHospitalLocation: z.string().optional().nullable(),
  requestingHospitalPhone: z.string().optional().nullable(),
  bloodType: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  urgency: z.enum(["critical", "normal"]).default("normal"),
  reason: z.string().optional().nullable(),
});

// ==================== TYPE EXPORTS ====================
export type User = typeof users.$inferSelect & {
  _id?: string;
};
export type InsertUser = typeof users.$inferInsert;

export type BloodInventory = typeof bloodInventory.$inferSelect & {
  _id?: string;
};
export type InsertBloodInventory = typeof bloodInventory.$inferInsert;

export type BloodRequest = typeof bloodRequests.$inferSelect & {
  _id?: string;
};
export type InsertBloodRequest = typeof bloodRequests.$inferInsert;

export type Donor = typeof donors.$inferSelect & {
  _id?: string;
};
export type InsertDonor = typeof donors.$inferInsert;

export type Staff = typeof staff.$inferSelect & {
  _id?: string;
};
export type InsertStaff = typeof staff.$inferInsert;

export type Receiver = typeof receivers.$inferSelect & {
  _id?: string;
};
export type InsertReceiver = typeof receivers.$inferInsert;

export type DonorResponse = typeof donorResponses.$inferSelect & {
  _id?: string;
};
export type InsertDonorResponse = typeof donorResponses.$inferInsert;

export type BloodExpiryAlert = typeof bloodExpiryAlerts.$inferSelect & {
  _id?: string;
};
export type InsertBloodExpiryAlert = typeof bloodExpiryAlerts.$inferInsert;

export type BloodDonationTracking = typeof bloodDonationTracking.$inferSelect & {
  _id?: string;
};
export type InsertBloodDonationTracking = typeof bloodDonationTracking.$inferInsert;

export type InterHospitalRequest = typeof interHospitalRequests.$inferSelect & {
  _id?: string;
};
export type InsertInterHospitalRequest = typeof interHospitalRequests.$inferInsert;
