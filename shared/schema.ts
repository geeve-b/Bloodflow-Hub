import { z } from "zod";

const bloodTypes = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as const;
const userRoles = ["donor", "hospital", "admin"] as const;
const staffRoles = ["admin", "nurse", "doctor", "technician", "staff"] as const;
const staffStatuses = ["active", "inactive"] as const;
const requestStatuses = ["pending", "approved", "fulfilled", "rejected"] as const;
const requestUrgencies = ["low", "medium", "high", "critical"] as const;
const inventoryStatuses = ["available", "reserved", "expired"] as const;

export const userSchema = z.object({
	_id: z.string().optional(),
	username: z.string().min(3, "Username must be at least 3 characters"),
	password: z.string().min(6, "Password must be at least 6 characters"),
	email: z.string().email().optional(),
	role: z.enum(userRoles).default("donor"),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

export const insertUserSchema = userSchema.pick({
	username: true,
	password: true,
	email: true,
	role: true,
});

export const bloodInventorySchema = z.object({
	_id: z.string().optional(),
	hospitalId: z.string(),
	bloodType: z.enum(bloodTypes),
	quantity: z.number().min(0, "Quantity cannot be negative"),
	expiryDate: z.date(),
	status: z.enum(inventoryStatuses).default("available"),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

export const insertBloodInventorySchema = bloodInventorySchema.pick({
	hospitalId: true,
	bloodType: true,
	quantity: true,
	expiryDate: true,
	status: true,
});

export const bloodRequestSchema = z.object({
	_id: z.string().optional(),
	requesterId: z.string(),
	requesterName: z.string(),
	hospitalName: z.string(),
	bloodType: z.enum(bloodTypes),
	quantity: z.number().min(1, "Quantity must be at least 1"),
	urgency: z.enum(requestUrgencies).default("medium"),
	reason: z.string().optional(),
	status: z.enum(requestStatuses).default("pending"),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
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

export const donorSchema = z.object({
	_id: z.string().optional(),
	userId: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	bloodType: z.enum(bloodTypes),
	phone: z.string(),
	address: z.string(),
	lastDonationDate: z.date().optional(),
	isActive: z.boolean().default(true),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

export const insertDonorSchema = donorSchema.pick({
	userId: true,
	firstName: true,
	lastName: true,
	bloodType: true,
	phone: true,
	address: true,
});

export const staffSchema = z.object({
	_id: z.string().optional(),
	name: z.string(),
	email: z.string().email(),
	phone: z.string(),
	role: z.enum(staffRoles),
	department: z.string(),
	employeeId: z.string(),
	status: z.enum(staffStatuses).default("active"),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

export const insertStaffSchema = staffSchema.pick({
	name: true,
	email: true,
	phone: true,
	role: true,
	department: true,
	employeeId: true,
	status: true,
});

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
