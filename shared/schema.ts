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
  bloodType: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  quantity: z.number().min(0, "Quantity cannot be negative"),
  expiryDate: z.date(),
  status: z.enum(["available", "reserved", "expired"]).default("available"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertBloodInventorySchema = bloodInventorySchema.pick({
  hospitalId: true,
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
  bloodType: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  urgency: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  reason: z.string().optional(),
  status: z.enum(["pending", "approved", "fulfilled", "rejected"]).default("pending"),
  rejectionReason: z.string().optional(),
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
  reason: true,
  status: true,
  rejectionReason: true,
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
  urgencyLevel: z.enum(["low", "medium", "high", "critical"]).default("medium"),
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
