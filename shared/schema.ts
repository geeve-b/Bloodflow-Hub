import { z } from "zod";
import { ObjectId } from "mongodb";

export const insertUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

export interface User extends InsertUser {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Blood Donation Models
export const donorSchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  bloodType: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  lastDonation: z.date().optional(),
  status: z.enum(["pending", "approved", "rejected"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Donor = z.infer<typeof donorSchema>;

export const bloodRequestSchema = z.object({
  _id: z.string().optional(),
  patientName: z.string(),
  hospital: z.string(),
  bloodType: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  units: z.number().min(1),
  urgency: z.enum(["normal", "urgent", "critical"]),
  status: z.enum(["pending", "fulfilled", "cancelled"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BloodRequest = z.infer<typeof bloodRequestSchema>;

// Staff Model
export const staffSchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  role: z.enum(["admin", "nurse", "doctor", "technician", "staff"]),
  department: z.string(),
  employeeId: z.string(),
  status: z.enum(["active", "inactive"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Staff = z.infer<typeof staffSchema>;
// ==================== USER SCHEMA ====================
export const userSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email().optional(),
  role: z.enum(["donor", "hospital", "admin"]).default("donor"),
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
