import {
  type User,
  type InsertUser,
  type BloodInventory,
  type InsertBloodInventory,
  type BloodRequest,
  type InsertBloodRequest,
  type Donor,
  type InsertDonor,
} from "@shared/schema";
import { db } from "./db";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

// ==================== STORAGE INTERFACE ====================
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Blood Inventory operations
  getBloodInventory(id: string): Promise<BloodInventory | undefined>;
  createBloodInventory(inventory: InsertBloodInventory): Promise<BloodInventory>;
  updateBloodInventory(
    id: string,
    inventory: Partial<InsertBloodInventory>
  ): Promise<BloodInventory | undefined>;
  deleteBloodInventory(id: string): Promise<boolean>;
  getAllBloodInventory(): Promise<BloodInventory[]>;
  getBloodInventoryByHospital(hospitalId: string): Promise<BloodInventory[]>;
  getBloodInventoryByType(bloodType: string): Promise<BloodInventory[]>;

  // Blood Request operations
  getBloodRequest(id: string): Promise<BloodRequest | undefined>;
  createBloodRequest(request: InsertBloodRequest): Promise<BloodRequest>;
  updateBloodRequest(
    id: string,
    request: Partial<InsertBloodRequest>
  ): Promise<BloodRequest | undefined>;
  deleteBloodRequest(id: string): Promise<boolean>;
  getAllBloodRequests(): Promise<BloodRequest[]>;
  getBloodRequestsByStatus(status: string): Promise<BloodRequest[]>;

  // Donor operations
  getDonor(id: string): Promise<Donor | undefined>;
  createDonor(donor: InsertDonor): Promise<Donor>;
  updateDonor(id: string, donor: Partial<InsertDonor>): Promise<Donor | undefined>;
  deleteDonor(id: string): Promise<boolean>;
  getAllDonors(): Promise<Donor[]>;
  getDonorsByBloodType(bloodType: string): Promise<Donor[]>;
}

// ==================== MONGODB STORAGE IMPLEMENTATION ====================
export class MongoDBStorage implements IStorage {
  // ==================== USER OPERATIONS ====================
  async getUser(id: string): Promise<User | undefined> {
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id) });
    return user as User | undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await db.collection("users").findOne({ username });
    return user as User | undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const newUser = {
      ...insertUser,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.collection("users").insertOne(newUser);
    return { ...newUser, _id: result.insertedId } as User;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const updateData = {
      ...user,
      updatedAt: new Date(),
    };
    if (user.password) {
      updateData.password = await bcrypt.hash(user.password, 10);
    }
    const result = await db
      .collection("users")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: "after" }
      );
    return result as User | undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db
      .collection("users")
      .deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  async getAllUsers(): Promise<User[]> {
    const users = await db.collection("users").find({}).toArray();
    return users as User[];
  }

  // ==================== BLOOD INVENTORY OPERATIONS ====================
  async getBloodInventory(id: string): Promise<BloodInventory | undefined> {
    const inventory = await db
      .collection("bloodInventory")
      .findOne({ _id: new ObjectId(id) });
    return inventory as BloodInventory | undefined;
  }

  async createBloodInventory(
    inventory: InsertBloodInventory
  ): Promise<BloodInventory> {
    const newInventory = {
      ...inventory,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db
      .collection("bloodInventory")
      .insertOne(newInventory);
    return { ...newInventory, _id: result.insertedId } as BloodInventory;
  }

  async updateBloodInventory(
    id: string,
    inventory: Partial<InsertBloodInventory>
  ): Promise<BloodInventory | undefined> {
    const updateData = {
      ...inventory,
      updatedAt: new Date(),
    };
    const result = await db
      .collection("bloodInventory")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: "after" }
      );
    return result as BloodInventory | undefined;
  }

  async deleteBloodInventory(id: string): Promise<boolean> {
    const result = await db
      .collection("bloodInventory")
      .deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  async getAllBloodInventory(): Promise<BloodInventory[]> {
    const inventory = await db
      .collection("bloodInventory")
      .find({})
      .toArray();
    return inventory as BloodInventory[];
  }

  async getBloodInventoryByHospital(
    hospitalId: string
  ): Promise<BloodInventory[]> {
    const inventory = await db
      .collection("bloodInventory")
      .find({ hospitalId })
      .toArray();
    return inventory as BloodInventory[];
  }

  async getBloodInventoryByType(bloodType: string): Promise<BloodInventory[]> {
    const inventory = await db
      .collection("bloodInventory")
      .find({ bloodType, status: "available" })
      .toArray();
    return inventory as BloodInventory[];
  }

  // ==================== BLOOD REQUEST OPERATIONS ====================
  async getBloodRequest(id: string): Promise<BloodRequest | undefined> {
    const request = await db
      .collection("bloodRequests")
      .findOne({ _id: new ObjectId(id) });
    return request as BloodRequest | undefined;
  }

  async createBloodRequest(
    request: InsertBloodRequest
  ): Promise<BloodRequest> {
    const newRequest = {
      ...request,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db
      .collection("bloodRequests")
      .insertOne(newRequest);
    return { ...newRequest, _id: result.insertedId } as BloodRequest;
  }

  async updateBloodRequest(
    id: string,
    request: Partial<InsertBloodRequest>
  ): Promise<BloodRequest | undefined> {
    const updateData = {
      ...request,
      updatedAt: new Date(),
    };
    const result = await db
      .collection("bloodRequests")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: "after" }
      );
    return result as BloodRequest | undefined;
  }

  async deleteBloodRequest(id: string): Promise<boolean> {
    const result = await db
      .collection("bloodRequests")
      .deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  async getAllBloodRequests(): Promise<BloodRequest[]> {
    const requests = await db
      .collection("bloodRequests")
      .find({})
      .toArray();
    return requests as BloodRequest[];
  }

  async getBloodRequestsByStatus(status: string): Promise<BloodRequest[]> {
    const requests = await db
      .collection("bloodRequests")
      .find({ status })
      .toArray();
    return requests as BloodRequest[];
  }

  // ==================== DONOR OPERATIONS ====================
  async getDonor(id: string): Promise<Donor | undefined> {
    const donor = await db
      .collection("donors")
      .findOne({ _id: new ObjectId(id) });
    return donor as Donor | undefined;
  }

  async createDonor(donor: InsertDonor): Promise<Donor> {
    const newDonor = {
      ...donor,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.collection("donors").insertOne(newDonor);
    return { ...newDonor, _id: result.insertedId } as Donor;
  }

  async updateDonor(
    id: string,
    donor: Partial<InsertDonor>
  ): Promise<Donor | undefined> {
    const updateData = {
      ...donor,
      updatedAt: new Date(),
    };
    const result = await db
      .collection("donors")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: "after" }
      );
    return result as Donor | undefined;
  }

  async deleteDonor(id: string): Promise<boolean> {
    const result = await db
      .collection("donors")
      .deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  async getAllDonors(): Promise<Donor[]> {
    const donors = await db.collection("donors").find({}).toArray();
    return donors as Donor[];
  }

  async getDonorsByBloodType(bloodType: string): Promise<Donor[]> {
    const donors = await db
      .collection("donors")
      .find({ bloodType, isActive: true })
      .toArray();
    return donors as Donor[];
  }
}

export const storage = new MongoDBStorage();
