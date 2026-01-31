import { z } from "zod";
import { ObjectId } from "mongodb";

// ==================== USER SCHEMA ====================
export const userSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email(),
  emailVerified: z.boolean().default(false),
  emailVerificationCode: z.string().nullable().optional(),
  emailVerificationExpiresAt: z.date().nullable().optional(),
  resetPasswordToken: z.string().nullable().optional(),
  resetPasswordExpires: z.date().nullable().optional(),
  role: z.enum(["donor", "hospital", "admin", "receiver"]).default("donor"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertUserSchema = userSchema.pick({
  username: true,
  password: true,
  email: true,
  role: true,
});

// ==================== BLOOD INVENTORY SCHEMA ====================
export const bloodInventorySchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  hospitalId: z.string(),
  hospitalName: z.string(),
  bloodType: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  quantity: z.number().min(0, "Quantity cannot be negative"),
  expiryDate: z.date(),
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

// ==================== BLOOD REQUEST SCHEMA ====================
export const bloodRequestSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  requesterId: z.string(),
  requesterName: z.string(),
  hospitalName: z.string(),
  hospitalLatitude: z.number().min(-90).max(90).optional(),
  hospitalLongitude: z.number().min(-180).max(180).optional(),
  bloodType: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  urgency: z.enum(["critical", "normal"]).default("normal"),
  patientName: z.string().min(1, "Patient name is required"),
  contactNumber: z.string().min(6, "Primary contact number is required"),
  secondaryContactNumber: z.string().optional(),
  reason: z.string().optional(),
  status: z.enum(["pending", "approved", "fulfilled", "rejected"]).default("pending"),
  approvedByHospitalId: z.string().optional(),
  approvedByHospitalName: z.string().optional(),
  priorityScore: z.number().min(0).max(1).default(0.5).optional(),
  rejectionReason: z.string().optional(),
  fulfilledByHospitalId: z.string().optional(),
  fulfilledByHospitalName: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertBloodRequestSchema = bloodRequestSchema.pick({
  requesterId: true,
  requesterName: true,
  hospitalName: true,
  bloodType: true,
  quantity: true,
  urgency: true,
  patientName: true,
  contactNumber: true,
  secondaryContactNumber: true,
  reason: true,
  status: true,
  hospitalLatitude: true,
  hospitalLongitude: true,
  priorityScore: true,
  rejectionReason: true,
  fulfilledByHospitalId: true,
  fulfilledByHospitalName: true,
});

// ==================== DONOR SCHEMA ====================
export const donorSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  userId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  bloodType: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  phone: z.string(),
  address: z.string(),
  state: z.string().optional(),
  region: z.string().optional(),
  lastDonationDate: z.date().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  availabilityWindows: z
    .array(
      z.object({
        start: z.string(),
        end: z.string(),
      })
    )
    .optional(),
  eligibilityStatus: z.enum(["eligible", "temporarily_ineligible", "permanently_ineligible"]).default("eligible"),
  eligibilityNotes: z.array(z.string()).optional(),
  deferralUntil: z.date().optional(),
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

// ==================== STAFF SCHEMA ====================
export const staffSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  userId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  staffId: z.string(),
  department: z.string(),
  position: z.string(),
  phone: z.string(),
  email: z.string().email(),
  hospitalName: z.string(),
  staff_id_document: z.string().optional(),
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

// ==================== RECEIVER SCHEMA ====================
export const receiverSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  userId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  bloodType: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  phone: z.string(),
  address: z.string(),
  hospitalName: z.string(),
  medicalCondition: z.string().optional(),
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

// ==================== DONOR RESPONSE SCHEMA ====================
export const donorResponseSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  requestId: z.string(),
  donorId: z.string(),
  donorEmail: z.string().email(),
  donorName: z.string(),
  token: z.string(),
  response: z.enum(["accepted", "declined", "pending"]).default("pending"),
  respondedAt: z.date().optional(),
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

// ==================== BLOOD EXPIRY ALERT SCHEMA ====================
export const bloodExpiryAlertSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  inventoryId: z.string(),
  hospitalId: z.string(),
  hospitalName: z.string(),
  bloodType: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  quantity: z.number().min(0),
  expiryDate: z.date(),
  daysRemaining: z.number().min(0),
  alertLevel: z.enum(["critical", "warning", "info"]),
  // critical: 1 day or less
  // warning: 3 days or less (but > 1 day)
  // info: 7 days or less (but > 3 days)
  alertSentAt: z.date(),
  emailsSent: z.array(z.object({
    email: z.string().email(),
    staffName: z.string(),
    sentAt: z.date(),
  })).default([]),
  acknowledged: z.boolean().default(false),
  acknowledgedBy: z.string().optional(),
  acknowledgedAt: z.date().optional(),
  acknowledgedNotes: z.string().optional(),
  resolved: z.boolean().default(false),
  resolvedBy: z.string().optional(),
  resolvedAt: z.date().optional(),
  resolvedNotes: z.string().optional(),
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

// ==================== BLOOD DONATION TRACKING SCHEMA ====================
export const bloodDonationTrackingSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  donorId: z.string(),
  donorName: z.string(),
  donorEmail: z.string().email(),
  bloodType: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  quantity: z.number().min(1),
  donationDate: z.date(),
  // Hospital that received the donation
  hospitalId: z.string(),
  hospitalName: z.string(),
  // Patient/Receiver information
  receiverId: z.string().optional(),
  receiverName: z.string().optional(),
  receiverHospitalName: z.string().optional(),
  medicalCondition: z.string().optional(),
  urgencyLevel: z.enum(["critical", "normal"]).default("normal"),
  // Tracking status
  status: z.enum([
    "collected",      // Blood collected from donor
    "in_transit",     // Being transported
    "received",       // Received by receiving hospital
    "in_use",         // Currently being used for patient
    "transfused",     // Successfully transfused to patient
    "expired",        // Blood expired
    "discarded",      // Blood was discarded
  ]).default("collected"),
  // Timeline tracking
  collectionTime: z.date().optional(),
  transitStartTime: z.date().optional(),
  receivedTime: z.date().optional(),
  usageStartTime: z.date().optional(),
  transfusionCompleteTime: z.date().optional(),
  // Additional tracking info
  trackingNotes: z.array(z.object({
    timestamp: z.date(),
    status: z.string(),
    note: z.string(),
    updatedBy: z.string().optional(),
  })).default([]),
  // Success/Outcome
  isSuccessful: z.boolean().optional(),
  outcomeNotes: z.string().optional(),
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

// ==================== TYPE EXPORTS ====================
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type BloodInventory = z.infer<typeof bloodInventorySchema>;
export type InsertBloodInventory = z.infer<typeof insertBloodInventorySchema>;

export type BloodRequest = z.infer<typeof bloodRequestSchema>;
export type InsertBloodRequest = z.infer<typeof insertBloodRequestSchema>;

export type Donor = z.infer<typeof donorSchema>;
export type InsertDonor = z.infer<typeof insertDonorSchema>;

export type Staff = z.infer<typeof staffSchema>;
export type InsertStaff = z.infer<typeof insertStaffSchema>;

export type Receiver = z.infer<typeof receiverSchema>;
export type InsertReceiver = z.infer<typeof insertReceiverSchema>;

export type DonorResponse = z.infer<typeof donorResponseSchema>;
export type InsertDonorResponse = z.infer<typeof insertDonorResponseSchema>;

export type BloodExpiryAlert = z.infer<typeof bloodExpiryAlertSchema>;
export type InsertBloodExpiryAlert = z.infer<typeof insertBloodExpiryAlertSchema>;

export type BloodDonationTracking = z.infer<typeof bloodDonationTrackingSchema>;
export type InsertBloodDonationTracking = z.infer<typeof insertBloodDonationTrackingSchema>;
