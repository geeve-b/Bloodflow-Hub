import { z } from "zod";

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
