import type { Express, Request, Response } from "express";
import type { Server } from "http";
import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  insertBloodInventorySchema,
  insertBloodRequestSchema,
  insertDonorSchema,
  insertUserSchema,
  insertStaffSchema,
} from "@shared/schema";
import { storage } from "./storage";
import {
  sendContactEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBloodRequestNotification,
  type ContactFormData,
} from "./email";
import { log } from "./index";
import { MatchmakingEngine } from "./matchmaking";
import { bloodExpiryService } from "./bloodExpiryService";

const removePassword = (user: any) => {
  if (!user || typeof user !== "object") {
    return user;
  }
  const {
    password: _password,
    emailVerificationCode: _emailVerificationCode,
    ...rest
  } = user as Record<string, unknown>;
  return rest;
};

const OTP_EXPIRATION_MINUTES = 10;

const generateVerificationCode = () =>
  randomInt(100000, 1000000).toString();

const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Username or email is required")
    .transform((value) => value.trim()),
  password: insertUserSchema.shape.password,
});

// ==================== FILE UPLOAD CONFIGURATION ====================
const uploadsDir = path.join(process.cwd(), "uploads", "staff_documents");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req: any, file: any, cb: any) => {
  const allowedMimes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF, JPG, JPEG, PNG are allowed"));
  }
};

const uploadMiddleware = multer({
  storage: storage_multer,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter,
});

const matchmakingEngine = new MatchmakingEngine(storage, {
  cacheTtlMs: 5 * 60 * 1000,
  maxDistanceKm: 150,
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
      const rawPayload = insertUserSchema.parse(req.body);
      const payload = {
        ...rawPayload,
        username: rawPayload.username.trim(),
        email: rawPayload.email.trim().toLowerCase(),
        password: rawPayload.password,
      };
      console.log("[DEBUG] Payload parsed:", payload.username, payload.role);

      const existingUser = await storage.getUserByUsername(payload.username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(payload.email);
      if (existingEmail) {
        return res.status(409).json({ error: "Email already in use" });
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
          state: req.body.state || "",
          region: req.body.region || "",
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
          urgencyLevel: req.body.urgencyLevel || "normal",
        };
        try {
          await storage.createReceiver(receiverData);
          console.log("✓ Receiver profile created for:", user._id);
        } catch (err) {
          console.log("⚠ Receiver creation optional, continuing:", err);
        }
      }

      const verificationCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);
      const codeHash = await bcrypt.hash(verificationCode, 10);
      const userId =
        typeof user._id === "string"
          ? user._id
          : user._id?.toString?.();
      if (!userId) {
        console.error("[DEBUG] Missing user ID after registration");
        return res.status(500).json({ error: "Registration failed" });
      }
      const userWithCode =
        (await storage.setEmailVerificationCode(
          userId,
          codeHash,
          expiresAt,
        )) ?? user;

      try {
        await sendVerificationEmail({
          email: user.email,
          name: req.body.firstName || user.username,
          code: verificationCode,
        });
      } catch (emailError) {
        console.error("[DEBUG] Verification email failed:", emailError);
        return res
          .status(500)
          .json({ error: "Failed to send verification email" });
      }

      console.log("[DEBUG] Sending registration response");
      res.status(201).json({
        message: "User registered successfully",
        user: removePassword(userWithCode),
        verification: {
          userId: userWithCode?._id,
          email: user.email,
          expiresAt: userWithCode?.emailVerificationExpiresAt,
        },
      });
    } catch (error) {
      console.log("[DEBUG] Registration error:", error);
      res.status(400).json({
        error: error instanceof Error ? error.message : "Registration failed",
      });
    }
  });

  app.post("/api/verify-email", async (req, res) => {
    const { userId, code } = req.body ?? {};
    const emailParam =
      typeof req.body?.email === "string"
        ? req.body.email.toLowerCase()
        : undefined;

    if (!userId && !emailParam) {
      return res.status(400).json({ error: "Missing verification target" });
    }
    if (!code) {
      return res.status(400).json({ error: "Verification code is required" });
    }

    try {
      const user = userId
        ? await storage.getUser(userId)
        : await storage.getUserByEmail(emailParam!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.emailVerified) {
        return res.json({
          message: "Email already verified",
          user: removePassword(user),
        });
      }

      if (!user.emailVerificationCode || !user.emailVerificationExpiresAt) {
        return res
          .status(400)
          .json({ error: "No verification code found. Please resend." });
      }

      const expiresAt =
        user.emailVerificationExpiresAt instanceof Date
          ? user.emailVerificationExpiresAt
          : new Date(user.emailVerificationExpiresAt);

      if (expiresAt.getTime() < Date.now()) {
        return res.status(400).json({ error: "Verification code expired" });
      }

      const isValid = await bcrypt.compare(code, user.emailVerificationCode);
      if (!isValid) {
        return res.status(400).json({ error: "Invalid verification code" });
      }

      const targetUserId =
        typeof user._id === "string"
          ? user._id
          : user._id?.toString?.() ?? userId;
      if (!targetUserId) {
        return res.status(500).json({ error: "Unable to verify email" });
      }
      const verifiedUser =
        (await storage.markEmailVerified(targetUserId)) ?? user;
      return res.json({
        message: "Email verified successfully",
        user: removePassword(verifiedUser),
      });
    } catch (error) {
      console.log("[DEBUG] Verify email error:", error);
      return res.status(500).json({ error: "Email verification failed" });
    }
  });

  app.post("/api/resend-verification", async (req, res) => {
    const { userId } = req.body ?? {};
    const emailParam =
      typeof req.body?.email === "string"
        ? req.body.email.toLowerCase()
        : undefined;

    if (!userId && !emailParam) {
      return res.status(400).json({ error: "Missing verification target" });
    }

    try {
      const user = userId
        ? await storage.getUser(userId)
        : await storage.getUserByEmail(emailParam!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ error: "Email already verified" });
      }

      const verificationCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);
      const codeHash = await bcrypt.hash(verificationCode, 10);
      const targetUserId =
        typeof user._id === "string"
          ? user._id
          : user._id?.toString?.() ?? userId;
      if (!targetUserId) {
        return res.status(500).json({ error: "Unable to prepare verification code" });
      }

      const updatedUser =
        (await storage.setEmailVerificationCode(
          targetUserId,
          codeHash,
          expiresAt,
        )) ?? user;

      try {
        await sendVerificationEmail({
          email: updatedUser.email,
          name: req.body?.name || updatedUser.username,
          code: verificationCode,
        });
      } catch (emailError) {
        console.error("[DEBUG] Resend verification email failed:", emailError);
        return res
          .status(500)
          .json({ error: "Failed to send verification email" });
      }

      return res.json({
        message: "Verification code resent",
        user: removePassword(updatedUser),
        verification: {
          userId: updatedUser._id,
          email: updatedUser.email,
          expiresAt: updatedUser.emailVerificationExpiresAt,
        },
      });
    } catch (error) {
      console.log("[DEBUG] Resend verification error:", error);
      return res
        .status(500)
        .json({ error: "Unable to resend verification code" });
    }
  });

  app.post("/api/login", async (req, res) => {
    console.log("[DEBUG] Login endpoint called with identifier:", req.body.identifier);
    try {
      const credentials = loginSchema.parse(req.body);
      const identifier = credentials.identifier;
      const isEmail = identifier.includes("@");
      console.log(
        "[DEBUG] Credentials parsed, resolving user for identifier:",
        identifier,
      );

      let user = undefined;

      if (isEmail) {
        user = await storage.getUserByEmail(identifier);
        console.log(
          user
            ? "[DEBUG] User resolved via email lookup"
            : "[DEBUG] Email lookup returned no match",
        );
      }

      if (!user) {
        user = await storage.getUserByUsername(identifier);
        console.log(
          user
            ? "[DEBUG] User resolved via username lookup"
            : "[DEBUG] Username lookup returned no match",
        );
      }

      if (!user) {
        console.log("[DEBUG] User not found for identifier:", identifier);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      console.log("[DEBUG] User found, comparing password");
      const isMatch = await bcrypt.compare(credentials.password, user.password);
      if (!isMatch) {
        console.log("[DEBUG] Password mismatch");
        return res.status(401).json({ error: "Invalid credentials" });
      }
      if (!user.emailVerified) {
        const userId =
          typeof user._id === "string"
            ? user._id
            : user._id?.toString?.();
        console.log("[DEBUG] Email not verified for user:", user._id);
        return res.status(403).json({
          error: "Email not verified",
          userId,
          email: user.email,
        });
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

  // ==================== PASSWORD RESET ROUTES ====================
  app.post("/api/forgot-password", async (req, res) => {
    console.log("[DEBUG] Forgot password called for:", req.body.email);
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log("[DEBUG] User not found for email:", email);
        // Return success even if user not found to prevent enumeration
        return res.json({ message: "If an account exists, a verification code has been sent." });
      }

      console.log("[DEBUG] User found, generating reset token for:", user._id);
      const verificationCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);
      const codeHash = await bcrypt.hash(verificationCode, 10);

      const userId = typeof user._id === "string" ? user._id : user._id?.toString?.();
      if (userId) {
        await storage.setResetPasswordToken(userId, codeHash, expiresAt);
        console.log("[DEBUG] Reset token set in DB, sending email...");
        await sendPasswordResetEmail({
          email: user.email,
          name: user.username,
          code: verificationCode,
        });
        console.log("[DEBUG] Email sending process completed");
      } else {
        console.error("[DEBUG] Failed to extract userId");
      }

      res.json({ message: "If an account exists, a verification code has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process request" });
    }
  });

  app.post("/api/verify-reset-otp", async (req, res) => {
    const { email, otp } = req.body;
    console.log(`[DEBUG] Verifying OTP for ${email}. OTP provided: ${otp}`);
    
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log("[DEBUG] User not found during OTP verification");
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }
      
      console.log(`[DEBUG] User found: ${user._id}. Has token: ${!!user.resetPasswordToken}, Expires: ${user.resetPasswordExpires}`);

      if (!user.resetPasswordToken || !user.resetPasswordExpires) {
        console.log("[DEBUG] No reset token or expiry found on user");
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      if (new Date() > new Date(user.resetPasswordExpires)) {
        console.log("[DEBUG] OTP expired");
        return res.status(400).json({ error: "OTP has expired" });
      }

      const isValid = await bcrypt.compare(otp, user.resetPasswordToken);
      console.log(`[DEBUG] OTP validation result: ${isValid}`);
      
      if (!isValid) {
        return res.status(400).json({ error: "Invalid OTP" });
      }

      res.json({ message: "OTP verified successfully" });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    const { email, otp, newPassword } = req.body;
    console.log(`[DEBUG] Resetting password for ${email}`);

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    try {
      const user = await storage.getUserByEmail(email);
      if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
        console.log("[DEBUG] Invalid request data during password reset");
        return res.status(400).json({ error: "Invalid request" });
      }

      if (new Date() > new Date(user.resetPasswordExpires)) {
        return res.status(400).json({ error: "OTP has expired" });
      }

      const isValid = await bcrypt.compare(otp, user.resetPasswordToken);
      if (!isValid) {
        console.log("[DEBUG] Invalid OTP during password reset");
        return res.status(400).json({ error: "Invalid OTP" });
      }

      const userId = typeof user._id === "string" ? user._id : user._id?.toString?.();
      if (userId) {
        console.log(`[DEBUG] Updating password for user ${userId}`);
        const updatedUser = await storage.updateUser(userId, { password: newPassword });
        console.log(`[DEBUG] Password update result: ${!!updatedUser}`);
        
        await storage.clearResetPasswordToken(userId);
        console.log("[DEBUG] Reset token cleared");
      } else {
        console.error("[DEBUG] Could not determine userId for password update");
      }

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // ==================== FETCH USER PROFILE DATA ====================
  app.get("/api/profile/:userId/:role", async (req, res) => {
    try {
      const { userId, role } = req.params;
      console.log(`Fetching profile for userId: ${userId}, role: ${role}`);
      let profileData = null;

      if (role === "donor") {
        const donors = await storage.getAllDonors();
        console.log(`Total donors in DB: ${donors.length}`);
        profileData = donors.find((d: any) => d.userId === userId);
        if (!profileData) {
          console.log(`No donor found with userId: ${userId}. Available userIds:`, donors.map((d: any) => d.userId));
          // Also log the first donor to understand the structure
          if (donors.length > 0) {
            console.log("Sample donor:", JSON.stringify(donors[0], null, 2));
          }
        } else {
          console.log("Donor found with bloodType:", profileData.bloodType);
        }
      } else if (role === "hospital") {
        const staffMembers = await storage.getAllStaff();
        profileData = staffMembers.find((s: any) => s.userId === userId);
      } else if (role === "receiver") {
        const receivers = await storage.getAllReceivers();
        profileData = receivers.find((r: any) => r.userId === userId);
      }

      if (!profileData) {
        console.log(`Profile data not found for ${role}:${userId}`);
        return res.status(404).json({ error: "Profile data not found" });
      }

      console.log(`Profile found:`, profileData);
      res.json(profileData);
    } catch (error) {
      console.error("Error in profile endpoint:", error);
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
      // Convert expiryDate string to Date object if needed
      const body = {
        ...req.body,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : new Date(),
      };
      const payload = insertBloodInventorySchema.parse(body);
      const inventory = await storage.createBloodInventory(payload);
      matchmakingEngine.clearCache();
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
      matchmakingEngine.clearCache();
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
      matchmakingEngine.clearCache();
      res.json({ message: "Blood inventory deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete inventory" });
    }
  });

  app.get("/api/blood-inventory/expiry/alerts", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const expiringInventory =
        await storage.getBloodInventoryExpiringWithin(days);
      res.json({
        expiringUnits: expiringInventory,
        totalExpiringWithin: expiringInventory.length,
        warningPeriodDays: days,
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch expiry alerts" });
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
      const requestId = req.params.id;
      
      // Validate ID format
      if (!requestId || requestId.length !== 24) {
        return res.status(400).json({ error: "Invalid request ID format" });
      }
      
      const request = await storage.getBloodRequest(requestId);
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
      console.log(`[DEBUG] Creating blood request for blood type: ${payload.bloodType}`);
      const request = await storage.createBloodRequest(payload);
      
      // Notify eligible donors asynchronously (don't wait for emails to send)
      setImmediate(async () => {
        try {
          console.log(`[DEBUG] Starting async notification for blood type: ${payload.bloodType}`);
          const eligibleDonors = await storage.getEligibleDonorsWithEmails(payload.bloodType);
          console.log(`[DEBUG] Found ${eligibleDonors.length} eligible donors for blood type ${payload.bloodType}`);
          
          if (eligibleDonors.length > 0) {
            log(`[INFO] Found ${eligibleDonors.length} eligible donors for blood type ${payload.bloodType}`);
            
            // Send emails to all eligible donors without waiting
            eligibleDonors.forEach(({ donor, email, username }) => {
              sendBloodRequestNotification({
                donorEmail: email,
                donorName: `${donor.firstName} ${donor.lastName}`,
                bloodType: payload.bloodType,
                urgency: payload.urgency,
                hospitalName: payload.hospitalName,
                requesterName: payload.requesterName,
              }).catch(error => {
                console.error(`[ERROR] Failed to send email to ${email}:`, error);
              });
            });
            
            log(`[INFO] Queued notifications for ${eligibleDonors.length} eligible donors`);
          } else {
            log(`[WARNING] No eligible donors found for blood type ${payload.bloodType}`);
          }
        } catch (emailError) {
          console.error("[ERROR] Failed to send donor notifications:", emailError);
        }
      });
      
      res.status(201).json(request);
      matchmakingEngine.clearCache();
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to create request",
      });
    }
  });

  // Separate endpoint to notify donors about blood requests
  app.post("/api/blood-requests/:id/notify-donors", async (req, res) => {
    try {
      const requestId = req.params.id;
      const request = await storage.getBloodRequest(requestId);
      
      if (!request) {
        return res.status(404).json({ error: "Blood request not found" });
      }

      console.log(`[DEBUG] Notifying eligible donors for blood type: ${request.bloodType}`);
      const eligibleDonors = await storage.getEligibleDonorsWithEmails(request.bloodType);
      
      console.log(`[DEBUG] Found ${eligibleDonors.length} eligible donors with emails`);
      
      if (eligibleDonors.length > 0) {
        log(`[INFO] Found ${eligibleDonors.length} eligible donors for blood type ${request.bloodType}`);
        
        // Send emails to all eligible donors
        const emailPromises = eligibleDonors.map(({ donor, email, username }) => {
          console.log(`[DEBUG] Sending email to ${email} for donor ${donor.firstName} ${donor.lastName}`);
          return sendBloodRequestNotification({
            donorEmail: email,
            donorName: `${donor.firstName} ${donor.lastName}`,
            bloodType: request.bloodType,
            urgency: request.urgency,
            hospitalName: request.hospitalName,
            requesterName: request.requesterName,
          }).catch(error => {
            // Log error but don't fail
            console.error(`[ERROR] Failed to send email to ${email}:`, error);
          });
        });
        
        await Promise.allSettled(emailPromises);
        log(`[INFO] Sent notifications to ${eligibleDonors.length} eligible donors`);
        
        res.status(200).json({
          message: `Notifications sent to ${eligibleDonors.length} eligible donors`,
          donorsNotified: eligibleDonors.length,
          requestId: request._id,
        });
      } else {
        log(`[WARNING] No eligible donors found for blood type ${request.bloodType}`);
        res.status(200).json({
          message: "No eligible donors found",
          donorsNotified: 0,
          requestId: request._id,
        });
      }
    } catch (error) {
      console.error("[ERROR] Failed to notify donors:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to notify donors",
      });
    }
  });

  app.put("/api/blood-requests/:id", async (req, res) => {
    try {
      const requestId = req.params.id;
      console.log("[DEBUG] Updating blood request:", requestId, "with data:", req.body);
      
      // Validate ID format
      if (!requestId || requestId.length !== 24) {
        console.log("[DEBUG] Invalid request ID format:", requestId);
        return res.status(400).json({ error: "Invalid request ID format" });
      }
      
      const updates = insertBloodRequestSchema.partial().parse(req.body);
      console.log("[DEBUG] Parsed updates:", updates);
      const request = await storage.updateBloodRequest(requestId, updates);
      
      if (!request) {
        console.log("[DEBUG] Blood request not found with ID:", requestId);
        return res.status(404).json({ error: "Blood request not found" });
      }
      
      console.log("[DEBUG] Successfully updated blood request:", request._id);
      matchmakingEngine.clearCache();
      res.json(request);
    } catch (error) {
      console.error("[ERROR] Failed to update blood request:", error);
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
      matchmakingEngine.clearCache();
      res.json({ message: "Blood request deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete request" });
    }
  });

  app.get("/api/blood-requests/search/advanced", async (req, res) => {
    try {
      const filters = {
        bloodType: req.query.bloodType as string | undefined,
        urgency: req.query.urgency as string | undefined,
        location: req.query.location as string | undefined,
        status: req.query.status as string | undefined,
        search: req.query.search as string | undefined,
      };

      const skip = parseInt(req.query.skip as string) || 0;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await storage.searchAndFilterBloodRequests(filters, {
        skip,
        limit,
      });

      res.json({
        requests: result.requests,
        total: result.total,
        page: Math.floor(skip / limit) + 1,
        pageSize: limit,
        totalPages: Math.ceil(result.total / limit),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to search blood requests" });
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
      matchmakingEngine.clearCache();
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
      matchmakingEngine.clearCache();
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
      matchmakingEngine.clearCache();
      res.json({ message: "Donor deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete donor" });
    }
  });

  // ==================== MATCHMAKING ROUTES ====================
  app.get(
    "/api/matchmaking/requests/:requestId/suggestions",
    async (req, res) => {
      try {
        const { requestId } = req.params;
        const limitParam = Number(req.query.limit);
        const limit = Number.isFinite(limitParam)
          ? Math.max(1, Math.min(20, limitParam))
          : 5;

        const matches = await matchmakingEngine.suggestDonors(requestId, limit);
        const suggestions = matches.map((match) => ({
          donorId: match.donor._id,
          donorName: `${match.donor.firstName} ${match.donor.lastName}`.trim(),
          bloodType: match.donor.bloodType,
          score: match.score,
          distanceKm: match.distanceKm,
          availabilityWindows: match.donor.availabilityWindows ?? [],
          eligibilityStatus: match.donor.eligibilityStatus,
          lastDonationDate: match.donor.lastDonationDate,
          rationale: match.rationale,
        }));

        res.json({ requestId, suggestions });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to get donor suggestions";
        res.status(400).json({ error: message });
      }
    }
  );

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

  app.post("/api/staff", uploadMiddleware.single("staffIdDocument"), async (req, res) => {
    try {
      const payload = insertStaffSchema.parse(req.body);
      
      // If file was uploaded, add the file path to the payload
      if (req.file) {
        payload.staff_id_document = `/uploads/staff_documents/${req.file.filename}`;
      }
      
      const staff = await storage.createStaff(payload);
      res.status(201).json(staff);
    } catch (error) {
      // Clean up uploaded file if there was an error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          log(`Failed to delete file: ${unlinkError}`);
        }
      }
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

  // ==================== BLOOD EXPIRY ALERT ROUTES ====================
  
  // Get all active expiry alerts
  app.get("/api/blood-expiry-alerts", async (_req, res) => {
    try {
      const alerts = await storage.getActiveBloodExpiryAlerts(false);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expiry alerts" });
    }
  });

  // Get alert summary (dashboard overview)
  app.get("/api/blood-expiry-alerts/summary", async (_req, res) => {
    try {
      const summary = await bloodExpiryService.getAlertSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alert summary" });
    }
  });

  // Get alerts by hospital
  app.get("/api/blood-expiry-alerts/hospital/:hospitalId", async (req, res) => {
    try {
      const alerts = await storage.getBloodExpiryAlertsByHospital(
        req.params.hospitalId
      );
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hospital alerts" });
    }
  });

  // Get alerts by severity level
  app.get("/api/blood-expiry-alerts/level/:level", async (req, res) => {
    try {
      const alerts = await storage.getBloodExpiryAlertsByLevel(
        req.params.level
      );
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts by level" });
    }
  });

  // Get specific alert details
  app.get("/api/blood-expiry-alerts/:id", async (req, res) => {
    try {
      const alert = await storage.getBloodExpiryAlert(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alert" });
    }
  });

  // Acknowledge an alert
  app.post("/api/blood-expiry-alerts/:id/acknowledge", async (req, res) => {
    try {
      const { userId, notes } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const updated = await storage.acknowledgeBloodExpiryAlert(
        req.params.id,
        userId,
        notes
      );
      if (!updated) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json({
        message: "Alert acknowledged successfully",
        alert: updated,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to acknowledge alert" });
    }
  });

  // Resolve an alert (mark as handled)
  app.post("/api/blood-expiry-alerts/:id/resolve", async (req, res) => {
    try {
      const { userId, notes } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const updated = await storage.resolveBloodExpiryAlert(
        req.params.id,
        userId,
        notes
      );
      if (!updated) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json({
        message: "Alert resolved successfully",
        alert: updated,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to resolve alert" });
    }
  });

  // Check and create new expiry alerts (can be called manually or scheduled)
  app.post("/api/blood-expiry-alerts/check/create", async (req, res) => {
    try {
      const result = await bloodExpiryService.checkAndCreateAlerts();
      res.json({
        message: "Expiry check completed",
        ...result,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check and create alerts" });
    }
  });

  // Delete a resolved alert
  app.delete("/api/blood-expiry-alerts/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBloodExpiryAlert(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json({ message: "Alert deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete alert" });
    }
  });

  return httpServer;
}
