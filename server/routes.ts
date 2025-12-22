import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import {
  insertBloodInventorySchema,
  insertBloodRequestSchema,
  insertDonorSchema,
  insertUserSchema,
  insertStaffSchema,
} from "@shared/schema";
import { storage } from "./storage";
import { sendContactEmail, type ContactFormData } from "./email";
import { log } from "./index";

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
  // ==================== HEALTH CHECK ====================
  app.get("/api/health", (req, res) => {
    console.log("[DEBUG] Health check endpoint called");
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ==================== AUTH ROUTES ====================
  app.post("/api/register", async (req, res) => {
    console.log("[DEBUG] Register endpoint called with body:", Object.keys(req.body));
    try {
      const payload = insertUserSchema.parse(req.body);
      console.log("[DEBUG] Payload parsed:", payload.username, payload.role);
      const existingUser = await storage.getUserByUsername(payload.username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }
      const user = await storage.createUser(payload);
      console.log("[DEBUG] User created:", user._id);
      
      // Create role-specific data in separate collections
      if (payload.role === "donor" && req.body.firstName && req.body.lastName && user._id) {
        const donorData = {
          userId: user._id.toString(),
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          bloodType: req.body.bloodType || "O+",
          phone: req.body.phone || "",
          address: req.body.address || "",
        };
        try {
          await storage.createDonor(donorData);
          console.log("✓ Donor profile created for:", user._id);
        } catch (err) {
          console.log("⚠ Donor creation optional, continuing:", err);
        }
      } else if (payload.role === "hospital" && req.body.firstName && req.body.lastName && user._id) {
        // Hospital staff registration
        const staffData = {
          userId: user._id.toString(),
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          staffId: req.body.staffId,
          department: req.body.department,
          position: req.body.position,
          phone: req.body.phone,
          email: req.body.email,
          hospitalName: req.body.hospitalName,
        };
        try {
          await storage.createStaff(staffData);
        } catch (err) {
          console.log("Staff creation optional, continuing");
        }
      } else if (payload.role === "receiver" && req.body.firstName && req.body.lastName && user._id) {
        // Blood receiver (patient) registration
        const receiverData = {
          userId: user._id.toString(),
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          bloodType: req.body.bloodType || "O+",
          phone: req.body.phone || "",
          address: req.body.address || "",
          hospitalName: req.body.hospitalName || "",
          medicalCondition: req.body.medicalCondition || "",
          urgencyLevel: req.body.urgencyLevel || "medium",
        };
        try {
          await storage.createReceiver(receiverData);
          console.log("✓ Receiver profile created for:", user._id);
        } catch (err) {
          console.log("⚠ Receiver creation optional, continuing:", err);
        }
      }

      console.log("[DEBUG] Sending registration response");
      res.status(201).json({
        message: "User registered successfully",
        user: removePassword(user),
      });
    } catch (error) {
      console.log("[DEBUG] Registration error:", error);
      res.status(400).json({
        error: error instanceof Error ? error.message : "Registration failed",
      });
    }
  });

  app.post("/api/login", async (req, res) => {
    console.log("[DEBUG] Login endpoint called with username:", req.body.username);
    try {
      const credentials = loginSchema.parse(req.body);
      console.log("[DEBUG] Credentials parsed, looking up user:", credentials.username);
      const user = await storage.getUserByUsername(credentials.username);
      if (!user) {
        console.log("[DEBUG] User not found:", credentials.username);
        return res.status(401).json({ error: "Invalid credentials" });
      }
      console.log("[DEBUG] User found, comparing password");
      const isMatch = await bcrypt.compare(credentials.password, user.password);
      if (!isMatch) {
        console.log("[DEBUG] Password mismatch");
        return res.status(401).json({ error: "Invalid credentials" });
      }
      console.log("[DEBUG] Login successful for user:", user._id);
      res.json({ message: "Login successful", user: removePassword(user) });
    } catch (error) {
      console.log("[DEBUG] Login error:", error);
      res.status(400).json({
        error: error instanceof Error ? error.message : "Login failed",
      });
    }
  });

  // ==================== FETCH USER PROFILE DATA ====================
  app.get("/api/profile/:userId/:role", async (req, res) => {
    try {
      const { userId, role } = req.params;
      let profileData = null;

      if (role === "donor") {
        const donors = await storage.getAllDonors();
        profileData = donors.find((d: any) => d.userId === userId);
      } else if (role === "hospital") {
        const staffMembers = await storage.getAllStaff();
        profileData = staffMembers.find((s: any) => s.userId === userId);
      } else if (role === "receiver") {
        const receivers = await storage.getAllReceivers();
        profileData = receivers.find((r: any) => r.userId === userId);
      }

      if (!profileData) {
        return res.status(404).json({ error: "Profile data not found" });
      }

      res.json(profileData);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to fetch profile",
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

  // ==================== RECEIVER ROUTES ====================
  app.get("/api/receivers", async (_req, res) => {
    try {
      const receivers = await storage.getAllReceivers();
      res.json(receivers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch receivers" });
    }
  });

  app.get("/api/receivers/:id", async (req, res) => {
    try {
      const receiver = await storage.getReceiver(req.params.id);
      if (!receiver) {
        return res.status(404).json({ error: "Receiver not found" });
      }
      res.json(receiver);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch receiver" });
    }
  });

  app.get("/api/receivers/blood-type/:bloodType", async (req, res) => {
    try {
      const receivers = await storage.getReceiversByBloodType(
        req.params.bloodType
      );
      res.json(receivers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch receivers by blood type" });
    }
  });

  app.post("/api/receivers", async (req, res) => {
    try {
      const payload = req.body;
      const receiver = await storage.createReceiver(payload);
      res.status(201).json(receiver);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to create receiver",
      });
    }
  });

  app.put("/api/receivers/:id", async (req, res) => {
    try {
      const updates = req.body;
      const receiver = await storage.updateReceiver(req.params.id, updates);
      if (!receiver) {
        return res.status(404).json({ error: "Receiver not found" });
      }
      res.json(receiver);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to update receiver",
      });
    }
  });

  app.delete("/api/receivers/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteReceiver(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Receiver not found" });
      }
      res.json({ message: "Receiver deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete receiver" });
    }
  });

  // ==================== HEALTH CHECK ====================
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "Bloodflow-Hub API is running" });
  });

  // Contact form endpoint
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const { name, email, subject, message } = req.body;

      // Validation
      if (!name || !email || !subject || !message) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email address",
        });
      }

      const contactData: ContactFormData = {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      };

      // Send emails
      await sendContactEmail(contactData);

      log(`Contact form submitted by ${contactData.email}`, "contact");

      return res.json({
        success: true,
        message: "Your message has been sent successfully. We'll get back to you soon!",
      });
    } catch (error) {
      console.error("Error sending contact email:", error);
      log(`Error sending contact email: ${error}`, "error");

      return res.status(500).json({
        success: false,
        message: "Failed to send message. Please try again later.",
      });
    }
  });

  return httpServer;
}
