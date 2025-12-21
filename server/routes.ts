import type { Express } from "express";
import { type Server } from "http";
import bcrypt from "bcryptjs";
import {
  insertBloodInventorySchema,
  insertBloodRequestSchema,
  insertDonorSchema,
  insertUserSchema,
  insertStaffSchema,
} from "@shared/schema";
import { storage } from "./storage";

const removePassword = (user: any) => {
  if (!user || typeof user !== "object") {
    return user;
  }
  const { password: _password, ...rest } = user as Record<string, unknown>;
  return rest;
};

const loginSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ==================== AUTH ROUTES ====================
  app.post("/api/register", async (req, res) => {
    try {
      const payload = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(payload.username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }
      const user = await storage.createUser(payload);
      res.status(201).json({
        message: "User registered successfully",
        user: removePassword(user),
      });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Registration failed",
      });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(credentials.username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const isMatch = await bcrypt.compare(credentials.password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      res.json({ message: "Login successful", user: removePassword(user) });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Login failed",
      });
    }
  });

  // ==================== USER ROUTES ====================
  app.get("/api/users", async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(removePassword));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(removePassword(user));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const payload = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(payload.username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }
      const user = await storage.createUser(payload);
      res.status(201).json(removePassword(user));
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to create user",
      });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const updates = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(removePassword(user));
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to update user",
      });
    }
  });

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
  app.get("/api/blood-inventory", async (_req, res) => {
    try {
      const inventory = await storage.getAllBloodInventory();
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blood inventory" });
    }
  });

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

  app.get("/api/blood-inventory/type/:bloodType", async (req, res) => {
    try {
      const inventory = await storage.getBloodInventoryByType(
        req.params.bloodType
      );
      res.json(inventory);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch blood inventory by type" });
    }
  });

  app.post("/api/blood-inventory", async (req, res) => {
    try {
      const payload = insertBloodInventorySchema.parse(req.body);
      const inventory = await storage.createBloodInventory(payload);
      res.status(201).json(inventory);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to create inventory",
      });
    }
  });

  app.put("/api/blood-inventory/:id", async (req, res) => {
    try {
      const updates = insertBloodInventorySchema.partial().parse(req.body);
      const inventory = await storage.updateBloodInventory(
        req.params.id,
        updates
      );
      if (!inventory) {
        return res.status(404).json({ error: "Blood inventory not found" });
      }
      res.json(inventory);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to update inventory",
      });
    }
  });

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
  app.get("/api/blood-requests", async (_req, res) => {
    try {
      const requests = await storage.getAllBloodRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blood requests" });
    }
  });

  app.get("/api/blood-requests/:id", async (req, res) => {
    try {
      const request = await storage.getBloodRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Blood request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blood request" });
    }
  });

  app.get("/api/blood-requests/status/:status", async (req, res) => {
    try {
      const requests = await storage.getBloodRequestsByStatus(
        req.params.status
      );
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blood requests" });
    }
  });

  app.post("/api/blood-requests", async (req, res) => {
    try {
      const payload = insertBloodRequestSchema.parse(req.body);
      const request = await storage.createBloodRequest(payload);
      res.status(201).json(request);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to create request",
      });
    }
  });

  app.put("/api/blood-requests/:id", async (req, res) => {
    try {
      const updates = insertBloodRequestSchema.partial().parse(req.body);
      const request = await storage.updateBloodRequest(
        req.params.id,
        updates
      );
      if (!request) {
        return res.status(404).json({ error: "Blood request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to update blood request",
      });
    }
  });

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
  app.get("/api/donors", async (_req, res) => {
    try {
      const donors = await storage.getAllDonors();
      res.json(donors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch donors" });
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
      res.status(500).json({ error: "Failed to fetch donor" });
    }
  });

  app.get("/api/donors/bloodtype/:bloodType", async (req, res) => {
    try {
      const donors = await storage.getDonorsByBloodType(req.params.bloodType);
      res.json(donors);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch donors by blood type" });
    }
  });

  app.post("/api/donors", async (req, res) => {
    try {
      const payload = insertDonorSchema.parse(req.body);
      const donor = await storage.createDonor(payload);
      res.status(201).json(donor);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to create donor",
      });
    }
  });

  app.put("/api/donors/:id", async (req, res) => {
    try {
      const updates = insertDonorSchema.partial().parse(req.body);
      const donor = await storage.updateDonor(req.params.id, updates);
      if (!donor) {
        return res.status(404).json({ error: "Donor not found" });
      }
      res.json(donor);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to update donor",
      });
    }
  });

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

  // ==================== STAFF ROUTES ====================
  app.get("/api/staff", async (_req, res) => {
    try {
      const staffMembers = await storage.getAllStaff();
      res.json(staffMembers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staff" });
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
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  app.post("/api/staff", async (req, res) => {
    try {
      const payload = insertStaffSchema.parse(req.body);
      const staff = await storage.createStaff(payload);
      res.status(201).json(staff);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to create staff",
      });
    }
  });

  app.put("/api/staff/:id", async (req, res) => {
    try {
      const updates = insertStaffSchema.partial().parse(req.body);
      const staff = await storage.updateStaff(req.params.id, updates);
      if (!staff) {
        return res.status(404).json({ error: "Staff member not found" });
      }
      res.json(staff);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to update staff",
      });
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
      res.status(500).json({ error: "Failed to delete staff" });
    }
  });

  // ==================== HEALTH CHECK ====================
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "Bloodflow-Hub API is running" });
  });

  return httpServer;
}
