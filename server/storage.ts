import mongoose, { Document, Schema } from "mongoose";
import { type User, type InsertUser, type Donor, type BloodRequest, type Staff } from "@shared/schema";

// MongoDB Schemas
const userSchema = new Schema<User & Document>(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const donorSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    bloodType: { type: String, required: true },
    lastDonation: Date,
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

const bloodRequestSchema = new Schema(
  {
    patientName: { type: String, required: true },
    hospital: { type: String, required: true },
    bloodType: { type: String, required: true },
    units: { type: Number, required: true },
    urgency: { type: String, enum: ["normal", "urgent", "critical"], default: "normal" },
    status: { type: String, enum: ["pending", "fulfilled", "cancelled"], default: "pending" },
  },
  { timestamps: true }
);

const staffSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ["admin", "nurse", "doctor", "technician", "staff"], required: true },
    department: { type: String, required: true },
    employeeId: { type: String, required: true, unique: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

const UserModel = mongoose.model<User & Document>("User", userSchema);
const DonorModel = mongoose.model<Donor & Document>("Donor", donorSchema);
const BloodRequestModel = mongoose.model<BloodRequest & Document>("BloodRequest", bloodRequestSchema);
const StaffModel = mongoose.model<Staff & Document>("Staff", staffSchema);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Donor operations
  getDonor(id: string): Promise<Donor | undefined>;
  getAllDonors(): Promise<Donor[]>;
  createDonor(donor: Donor): Promise<Donor>;
  updateDonor(id: string, donor: Partial<Donor>): Promise<Donor | undefined>;
  
  // Blood Request operations
  getBloodRequest(id: string): Promise<BloodRequest | undefined>;
  getAllBloodRequests(): Promise<BloodRequest[]>;
  createBloodRequest(request: BloodRequest): Promise<BloodRequest>;
  updateBloodRequest(id: string, request: Partial<BloodRequest>): Promise<BloodRequest | undefined>;
  
  // Staff operations
  getStaff(id: string): Promise<Staff | undefined>;
  getAllStaff(): Promise<Staff[]>;
  createStaff(staff: Staff): Promise<Staff>;
  updateStaff(id: string, staff: Partial<Staff>): Promise<Staff | undefined>;
  deleteStaff(id: string): Promise<boolean>;
}

export class MongoStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findById(id).lean();
    return user ? (user as User) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ username }).lean();
    return user ? (user as User) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = new UserModel(insertUser);
    await user.save();
    return user.toObject() as User;
  }

  async getDonor(id: string): Promise<Donor | undefined> {
    const donor = await DonorModel.findById(id).lean();
    return donor ? (donor as Donor) : undefined;
  }

  async getAllDonors(): Promise<Donor[]> {
    return await DonorModel.find().lean() as Donor[];
  }

  async createDonor(donor: Donor): Promise<Donor> {
    const newDonor = new DonorModel(donor);
    await newDonor.save();
    return newDonor.toObject() as Donor;
  }

  async updateDonor(id: string, donor: Partial<Donor>): Promise<Donor | undefined> {
    const updated = await DonorModel.findByIdAndUpdate(id, donor, { new: true }).lean();
    return updated ? (updated as Donor) : undefined;
  }

  async getBloodRequest(id: string): Promise<BloodRequest | undefined> {
    const request = await BloodRequestModel.findById(id).lean();
    return request ? (request as BloodRequest) : undefined;
  }

  async getAllBloodRequests(): Promise<BloodRequest[]> {
    return await BloodRequestModel.find().lean() as BloodRequest[];
  }

  async createBloodRequest(request: BloodRequest): Promise<BloodRequest> {
    const newRequest = new BloodRequestModel(request);
    await newRequest.save();
    return newRequest.toObject() as BloodRequest;
  }

  async updateBloodRequest(id: string, request: Partial<BloodRequest>): Promise<BloodRequest | undefined> {
    const updated = await BloodRequestModel.findByIdAndUpdate(id, request, { new: true }).lean();
    return updated ? (updated as BloodRequest) : undefined;
  }

  async getStaff(id: string): Promise<Staff | undefined> {
    const staff = await StaffModel.findById(id).lean();
    return staff ? (staff as Staff) : undefined;
  }

  async getAllStaff(): Promise<Staff[]> {
    return await StaffModel.find().lean() as Staff[];
  }

  async createStaff(staff: Staff): Promise<Staff> {
    const newStaff = new StaffModel(staff);
    await newStaff.save();
    return newStaff.toObject() as Staff;
  }

  async updateStaff(id: string, staff: Partial<Staff>): Promise<Staff | undefined> {
    const updated = await StaffModel.findByIdAndUpdate(id, staff, { new: true }).lean();
    return updated ? (updated as Staff) : undefined;
  }

  async deleteStaff(id: string): Promise<boolean> {
    const result = await StaffModel.findByIdAndDelete(id);
    return !!result;
  }
}

export const storage = new MongoStorage();
