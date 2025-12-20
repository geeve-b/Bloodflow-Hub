import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, donorSchema, bloodRequestSchema, staffSchema } from "@shared/schema";

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

  app.get("/api/blood-requests", async (_req, res) => {
    try {
      const requests = await storage.getAllBloodRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch blood requests" });
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
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch blood request" });
    }
  });

  app.put("/api/blood-requests/:id", async (req, res) => {
    try {
      const requestData = bloodRequestSchema.partial().parse(req.body);
      const request = await storage.updateBloodRequest(req.params.id, requestData);
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

  return httpServer;
}
