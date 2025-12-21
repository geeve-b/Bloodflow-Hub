import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, donorSchema, bloodRequestSchema, staffSchema } from "@shared/schema";
import {
  insertUserSchema,
  insertBloodInventorySchema,
  insertBloodRequestSchema,
  insertDonorSchema,
} from "@shared/schema";
import bcrypt from "bcryptjs";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Routes
  app.post("/api/register", async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Simple password storage (NOT for production!)
      const user = await storage.createUser({
        username,
        password,
      });

      res.json({ message: "User registered successfully", user });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json({ message: "Login successful", user });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Login failed" });
    }
  });

  // Donor Routes
  app.post("/api/donors", async (req, res) => {
    try {
      const donorData = donorSchema.parse(req.body);
      const donor = await storage.createDonor(donorData);
      res.status(201).json(donor);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create donor" });
    }
  });

  app.get("/api/donors", async (_req, res) => {
    try {
      const donors = await storage.getAllDonors();
      res.json(donors);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch donors" });
    }
  });

  app.get("/api/donors/:id", async (req, res) => {
    try {
      const donor = await storage.getDonor(req.params.id);
      if (!donor) {
        return res.status(404).json({ error: "Donor not found" });
      }
      res.json(donor);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch donor" });
    }
  });

  app.put("/api/donors/:id", async (req, res) => {
    try {
      const donorData = donorSchema.partial().parse(req.body);
      const donor = await storage.updateDonor(req.params.id, donorData);
      if (!donor) {
        return res.status(404).json({ error: "Donor not found" });
      }
      res.json(donor);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update donor" });
    }
  });

  // Blood Request Routes
  app.post("/api/blood-requests", async (req, res) => {
    try {
      const requestData = bloodRequestSchema.parse(req.body);
      const request = await storage.createBloodRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create blood request" });
    }
  });

  // ==================== USER ROUTES ====================

  // Get all users
  app.get("/api/users", async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Create user (Register)
  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create user" });
    }
  });

  // Update user
  app.put("/api/users/:id", async (req, res) => {
    try {
      const validatedData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, validatedData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update user" });
    }
  });

  // Delete user
  app.delete("/api/users/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // ==================== BLOOD INVENTORY ROUTES ====================

  // Get all blood inventory
  app.get("/api/blood-inventory", async (_req, res) => {
    try {
      const inventory = await storage.getAllBloodInventory();
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blood inventory" });
    }
  });

  // Get blood inventory by ID
  app.get("/api/blood-inventory/:id", async (req, res) => {
    try {
      const inventory = await storage.getBloodInventory(req.params.id);
      if (!inventory) {
        return res.status(404).json({ error: "Blood inventory not found" });
      }
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blood inventory" });
    }
  });

  // Get blood inventory by hospital
  app.get("/api/blood-inventory/hospital/:hospitalId", async (req, res) => {
    try {
      const inventory = await storage.getBloodInventoryByHospital(
        req.params.hospitalId
      );
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hospital inventory" });
    }
  });

  // Get blood inventory by blood type
  app.get("/api/blood-inventory/type/:bloodType", async (req, res) => {
    try {
      const inventory = await storage.getBloodInventoryByType(req.params.bloodType);
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blood inventory by type" });
    }
  });

  // Create blood inventory
  app.post("/api/blood-inventory", async (req, res) => {
    try {
      const validatedData = insertBloodInventorySchema.parse(req.body);
      const inventory = await storage.createBloodInventory(validatedData);
      res.status(201).json(inventory);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create inventory" });
    }
  });

  // Update blood inventory
  app.put("/api/blood-inventory/:id", async (req, res) => {
    try {
      const validatedData = insertBloodInventorySchema.partial().parse(req.body);
      const inventory = await storage.updateBloodInventory(
        req.params.id,
        validatedData
      );
      if (!inventory) {
        return res.status(404).json({ error: "Blood inventory not found" });
      }
      res.json(inventory);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update inventory" });
    }
  });

  // Delete blood inventory
  app.delete("/api/blood-inventory/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBloodInventory(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Blood inventory not found" });
      }
      res.json({ message: "Blood inventory deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete inventory" });
    }
  });

  // ==================== BLOOD REQUEST ROUTES ====================

  // Get all blood requests
  app.get("/api/blood-requests", async (_req, res) => {
    try {
      const requests = await storage.getAllBloodRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch blood requests" });
    }
  });

      res.status(500).json({ error: "Failed to fetch blood requests" });
    }
  });

  // Get blood request by ID
  app.get("/api/blood-requests/:id", async (req, res) => {
    try {
      const request = await storage.getBloodRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Blood request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch blood request" });
    }
  });

  app.put("/api/blood-requests/:id", async (req, res) => {
    try {
      const requestData = bloodRequestSchema.partial().parse(req.body);
      const request = await storage.updateBloodRequest(req.params.id, requestData);
      res.status(500).json({ error: "Failed to fetch blood request" });
    }
  });

  // Get blood requests by status
  app.get("/api/blood-requests/status/:status", async (req, res) => {
    try {
      const requests = await storage.getBloodRequestsByStatus(req.params.status);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blood requests" });
    }
  });

  // Create blood request
  app.post("/api/blood-requests", async (req, res) => {
    try {
      const validatedData = insertBloodRequestSchema.parse(req.body);
      const request = await storage.createBloodRequest(validatedData);
      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create request" });
    }
  });

  // Update blood request
  app.put("/api/blood-requests/:id", async (req, res) => {
    try {
      const validatedData = insertBloodRequestSchema.partial().parse(req.body);
      const request = await storage.updateBloodRequest(
        req.params.id,
        validatedData
      );
      if (!request) {
        return res.status(404).json({ error: "Blood request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update blood request" });
    }
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "Bloodflow Hub API is running" });
  });

  // Staff Routes
  app.post("/api/staff", async (req, res) => {
    try {
      const staffData = staffSchema.parse(req.body);
      const staff = await storage.createStaff(staffData);
      res.status(201).json(staff);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create staff" });
    }
  });

  app.get("/api/staff", async (_req, res) => {
    try {
      const staffMembers = await storage.getAllStaff();
      res.json(staffMembers);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch staff" });
    }
  });

  app.get("/api/staff/:id", async (req, res) => {
    try {
      const staff = await storage.getStaff(req.params.id);
      if (!staff) {
        return res.status(404).json({ error: "Staff member not found" });
      }
      res.json(staff);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch staff" });
    }
  });

  app.put("/api/staff/:id", async (req, res) => {
    try {
      const staffData = staffSchema.partial().parse(req.body);
      const staff = await storage.updateStaff(req.params.id, staffData);
      if (!staff) {
        return res.status(404).json({ error: "Staff member not found" });
      }
      res.json(staff);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update staff" });
    }
  });

  app.delete("/api/staff/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteStaff(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Staff member not found" });
      }
      res.json({ message: "Staff member deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete staff" });
    }
  });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update request" });
    }
  });

  // Delete blood request
  app.delete("/api/blood-requests/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBloodRequest(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Blood request not found" });
      }
      res.json({ message: "Blood request deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete request" });
    }
  });

  // ==================== DONOR ROUTES ====================

  // Get all donors
  app.get("/api/donors", async (_req, res) => {
    try {
      const donors = await storage.getAllDonors();
      res.json(donors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch donors" });
    }
  });

  // Get donor by ID
  app.get("/api/donors/:id", async (req, res) => {
    try {
      const donor = await storage.getDonor(req.params.id);
      if (!donor) {
        return res.status(404).json({ error: "Donor not found" });
      }
      res.json(donor);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch donor" });
    }
  });

  // Get donors by blood type
  app.get("/api/donors/bloodtype/:bloodType", async (req, res) => {
    try {
      const donors = await storage.getDonorsByBloodType(req.params.bloodType);
      res.json(donors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch donors by blood type" });
    }
  });

  // Create donor
  app.post("/api/donors", async (req, res) => {
    try {
      const validatedData = insertDonorSchema.parse(req.body);
      const donor = await storage.createDonor(validatedData);
      res.status(201).json(donor);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create donor" });
    }
  });

  // Update donor
  app.put("/api/donors/:id", async (req, res) => {
    try {
      const validatedData = insertDonorSchema.partial().parse(req.body);
      const donor = await storage.updateDonor(req.params.id, validatedData);
      if (!donor) {
        return res.status(404).json({ error: "Donor not found" });
      }
      res.json(donor);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update donor" });
    }
  });

  // Delete donor
  app.delete("/api/donors/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDonor(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Donor not found" });
      }
      res.json({ message: "Donor deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete donor" });
    }
  });

  // ==================== HEALTH CHECK ====================
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "Bloodflow-Hub API is running" });
  });

  return httpServer;
}
