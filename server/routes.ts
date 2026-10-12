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
  insertInterHospitalRequestSchema,
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
import { initializeRealtime } from "./realtime";
import { bloodExpiryService } from "./bloodExpiryService";
import { DonationError, donationHistoryService } from "./donationHistory";
import { eligibilityReminderService, getDonorEligibility } from "./eligibilityReminder";
import { achievementBadgeService } from "./achievementBadges";
import {
  createStaffProfileToken,
  endSession,
  isStaff,
  loadSessionUser,
  loginBlockReason,
  readStaffProfileToken,
  requireAuth,
  requireRole,
  requireSelfOr,
  startSession,
  toSessionUser,
} from "./auth";

const errorMessage = (error: unknown, fallback: string) => {
  if (error instanceof z.ZodError) {
    return error.issues
      .map((issue) => (issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message))
      .join("; ");
  }
  return error instanceof Error ? error.message : fallback;
};

// One-time codes are 6 digits, so cap wrong guesses per code. Issuing a new code resets the count.
const MAX_CODE_ATTEMPTS = 5;
const failedCodeAttempts = new Map<string, number>();
const tooManyCodeAttempts = (key: string) => (failedCodeAttempts.get(key) ?? 0) >= MAX_CODE_ATTEMPTS;
const recordFailedCodeAttempt = (key: string) =>
  failedCodeAttempts.set(key, (failedCodeAttempts.get(key) ?? 0) + 1);
const TOO_MANY_ATTEMPTS = "Too many incorrect attempts. Please request a new code.";

const removePassword = (user: any) => {
  if (!user || typeof user !== "object") {
    return user;
  }
  const {
    password: _password,
    emailVerificationCode: _emailVerificationCode,
    resetPasswordToken: _resetPasswordToken,
    resetPasswordExpires: _resetPasswordExpires,
    ...rest
  } = user as Record<string, unknown>;
  return rest;
};

const authUser = (user: any) => ({
  ...removePassword(user),
  ...toSessionUser(user),
  name: user.username,
});

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
    cb(Object.assign(new Error("Invalid file type. Only PDF, JPG, JPEG, PNG are allowed"), { status: 400 }));
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

// ==================== BLOOD COMPATIBILITY HELPERS ====================
const BLOOD_COMPATIBILITY: Record<string, string[]> = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

function getCompatibleDonorTypes(requestedBloodType: string): string[] {
  return BLOOD_COMPATIBILITY[requestedBloodType] ?? [requestedBloodType];
}

/**
 * Takes `units` of blood for a patient of `bloodType` out of a hospital's unexpired stock,
 * preferring the exact type and the soonest-expiring units. Returns false (and changes
 * nothing) when the hospital doesn't hold enough compatible blood.
 */
async function consumeInventory(hospitalId: string, bloodType: string, units: number) {
  const compatible = getCompatibleDonorTypes(bloodType);
  const now = Date.now();
  const stock = (await storage.getBloodInventoryByHospital(hospitalId))
    .filter(
      (entry) =>
        compatible.includes(entry.bloodType) &&
        entry.quantity > 0 &&
        new Date(entry.expiryDate).getTime() > now,
    )
    .sort(
      (a, b) =>
        Number(b.bloodType === bloodType) - Number(a.bloodType === bloodType) ||
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime(),
    );

  if (stock.reduce((sum, entry) => sum + entry.quantity, 0) < units) return false;

  let remaining = units;
  for (const entry of stock) {
    if (remaining === 0) break;
    const take = Math.min(entry.quantity, remaining);
    const quantity = entry.quantity - take;
    await storage.updateBloodInventory(String(entry.id), {
      quantity,
      status: quantity > 0 ? "available" : "not_available",
    });
    remaining -= take;
  }
  return true;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const realtime = initializeRealtime(httpServer);
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
      if (rawPayload.role === "admin") {
        return res.status(403).json({ error: "Admin accounts cannot be created through registration" });
      }
      const payload = {
        username: rawPayload.username.trim(),
        email: rawPayload.email.trim().toLowerCase(),
        password: rawPayload.password,
        role: rawPayload.role,
        // Hospitals must be approved by an admin before they can sign in
        approvalStatus: rawPayload.role === "hospital" ? "pending" : undefined,
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
          eligibilityStatus: "eligible" as const,
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
      const userId = user.id || user._id;
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

      // The account already exists at this point, so a failed email must not fail the
      // registration; the user can request a new code from the verification page.
      let emailSent = true;
      try {
        await sendVerificationEmail({
          email: user.email,
          name: req.body.firstName || user.username,
          code: verificationCode,
        });
      } catch (emailError) {
        emailSent = false;
        console.error("[ERROR] Verification email failed:", emailError);
      }
      failedCodeAttempts.delete(`verify:${userId}`);

      console.log("[DEBUG] Sending registration response");
      res.status(201).json({
        message: emailSent
          ? "User registered successfully"
          : "Account created, but we could not send the verification email. Please request a new code.",
        emailSent,
        ...(payload.role === "hospital" && { staffProfileToken: createStaffProfileToken(String(userId)) }),
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
        error: errorMessage(error, "Registration failed"),
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

      const targetUserId = String(user.id || user._id);
      const attemptKey = `verify:${targetUserId}`;
      if (tooManyCodeAttempts(attemptKey)) {
        return res.status(429).json({ error: TOO_MANY_ATTEMPTS });
      }

      const isValid = await bcrypt.compare(String(code), user.emailVerificationCode);
      if (!isValid) {
        recordFailedCodeAttempt(attemptKey);
        return res.status(400).json({ error: "Invalid verification code" });
      }
      failedCodeAttempts.delete(attemptKey);

      const verifiedUser =
        (await storage.markEmailVerified(targetUserId)) ?? user;
      const blockReason = loginBlockReason(toSessionUser(verifiedUser));
      if (!blockReason) {
        startSession(req, res, targetUserId);
      }
      return res.json({
        message: blockReason
          ? `Email verified. ${blockReason}`
          : "Email verified successfully",
        requiresApproval: Boolean(blockReason),
        user: authUser(verifiedUser),
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
      const targetUserId = user.id || user._id || userId;
      if (!targetUserId) {
        return res.status(500).json({ error: "Unable to prepare verification code" });
      }

      const updatedUser =
        (await storage.setEmailVerificationCode(
          targetUserId,
          codeHash,
          expiresAt,
        )) ?? user;
      failedCodeAttempts.delete(`verify:${targetUserId}`);

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

  app.get("/api/session", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Not logged in" });
    const user = await storage.getUser(req.user.id);
    res.json({ user: user ? authUser(user) : req.user });
  });

  app.post("/api/logout", (_req, res) => {
    endSession(res);
    res.json({ message: "Logged out" });
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
        const userId = user.id || user._id;
        console.log("[DEBUG] Email not verified for user:", userId);
        return res.status(403).json({
          error: "Email not verified",
          code: "EMAIL_NOT_VERIFIED",
          userId,
          email: user.email,
        });
      }
      const blockReason = loginBlockReason(toSessionUser(user));
      if (blockReason) {
        return res.status(403).json({ error: blockReason, code: "APPROVAL_REQUIRED" });
      }
      startSession(req, res, String(user.id || user._id));
      console.log("[DEBUG] Login successful for user:", user._id);
      res.json({ message: "Login successful", user: authUser(user) });
    } catch (error) {
      console.log("[DEBUG] Login error:", error);
      res.status(400).json({
        error: errorMessage(error, "Login failed"),
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

      const userId = String(user.id || user._id);
      await storage.setResetPasswordToken(userId, codeHash, expiresAt);
      failedCodeAttempts.delete(`reset:${user.email.toLowerCase()}`);
      // Sent in the background so response time doesn't reveal whether the account exists
      sendPasswordResetEmail({
        email: user.email,
        name: user.username,
        code: verificationCode,
      }).catch((emailError) => console.error("[ERROR] Password reset email failed:", emailError));

      res.json({ message: "If an account exists, a verification code has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process request" });
    }
  });

  app.post("/api/verify-reset-otp", async (req, res) => {
    const { email, otp } = req.body;
    console.log(`[DEBUG] Verifying OTP for ${email}`);
    
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

      const attemptKey = `reset:${user.email.toLowerCase()}`;
      if (tooManyCodeAttempts(attemptKey)) {
        return res.status(429).json({ error: TOO_MANY_ATTEMPTS });
      }
      const isValid = await bcrypt.compare(String(otp), user.resetPasswordToken);
      if (!isValid) {
        recordFailedCodeAttempt(attemptKey);
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

      const attemptKey = `reset:${user.email.toLowerCase()}`;
      if (tooManyCodeAttempts(attemptKey)) {
        return res.status(429).json({ error: TOO_MANY_ATTEMPTS });
      }
      const isValid = await bcrypt.compare(String(otp), user.resetPasswordToken);
      if (!isValid) {
        recordFailedCodeAttempt(attemptKey);
        return res.status(400).json({ error: "Invalid OTP" });
      }

      const passwordCheck = insertUserSchema.shape.password.safeParse(newPassword);
      if (!passwordCheck.success) {
        return res.status(400).json({ error: passwordCheck.error.issues[0].message });
      }

      const userId = user.id || user._id;
      if (userId) {
        console.log(`[DEBUG] Updating password for user ${userId}`);
        const updatedUser = await storage.updateUser(userId, { password: newPassword });
        console.log(`[DEBUG] Password update result: ${!!updatedUser}`);
        
        await storage.clearResetPasswordToken(userId);
        failedCodeAttempts.delete(attemptKey);
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
  app.get("/api/profile/:userId/:role", requireSelfOr("userId", "hospital", "admin"), async (req, res) => {
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
        error: errorMessage(error, "Failed to fetch profile"),
      });
    }
  });

  // ==================== USER ROUTES ====================
  app.get("/api/users", requireRole("admin"), async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(removePassword));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", requireSelfOr("id", "admin"), async (req, res) => {
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

  app.post("/api/users", requireRole("admin"), async (req, res) => {
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
        error: errorMessage(error, "Failed to create user"),
      });
    }
  });

  app.put("/api/users/:id", requireRole("admin"), async (req, res) => {
    try {
      const updates = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(removePassword(user));
    } catch (error) {
      res.status(400).json({
        error: errorMessage(error, "Failed to update user"),
      });
    }
  });

  app.delete("/api/users/:id", requireRole("admin"), async (req, res) => {
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
  app.get("/api/blood-inventory", requireAuth, async (_req, res) => {
    try {
      const inventory = await storage.getAllBloodInventory();
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blood inventory" });
    }
  });

  app.get("/api/blood-inventory/:id", requireAuth, async (req, res) => {
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

  app.get("/api/blood-inventory/hospital/:hospitalId", requireAuth, async (req, res) => {
    try {
      const inventory = await storage.getBloodInventoryByHospital(
        req.params.hospitalId
      );
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hospital inventory" });
    }
  });

  app.get("/api/blood-inventory/type/:bloodType", requireAuth, async (req, res) => {
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

  app.post("/api/blood-inventory", requireRole("hospital", "admin"), async (req, res) => {
    try {
      // Convert expiryDate string to Date object if needed
      const body = {
        ...req.body,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : new Date(),
      };
      const payload = insertBloodInventorySchema.parse(body);
      if (req.user!.role === "hospital") payload.hospitalId = req.user!.id;
      const inventory = await storage.createBloodInventory(payload);
      matchmakingEngine.clearCache();
      res.status(201).json(inventory);
    } catch (error) {
      res.status(400).json({
        error:
          errorMessage(error, "Failed to create inventory"),
      });
    }
  });

  app.put("/api/blood-inventory/:id", requireRole("hospital", "admin"), async (req, res) => {
    try {
      const updates = insertBloodInventorySchema.partial().parse(req.body);
      delete updates.hospitalId;
      const existing = await storage.getBloodInventory(req.params.id);
      if (!existing || (req.user!.role === "hospital" && existing.hospitalId !== req.user!.id)) {
        return res.status(404).json({ error: "Blood inventory not found" });
      }
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
          errorMessage(error, "Failed to update inventory"),
      });
    }
  });

  app.delete("/api/blood-inventory/:id", requireRole("hospital", "admin"), async (req, res) => {
    try {
      const existing = await storage.getBloodInventory(req.params.id);
      if (!existing || (req.user!.role === "hospital" && existing.hospitalId !== req.user!.id)) {
        return res.status(404).json({ error: "Blood inventory not found" });
      }
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

  app.get("/api/blood-inventory/expiry/alerts", requireRole("hospital", "admin"), async (req, res) => {
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
  app.get("/api/blood-requests", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getAllBloodRequests();
      // Donors and receivers only see the requests they raised
      res.json(isStaff(req.user) ? requests : requests.filter((r) => r.requesterId === req.user!.id));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blood requests" });
    }
  });

  app.get("/api/blood-requests/:id", requireAuth, async (req, res) => {
    try {
      const requestId = req.params.id;
      const request = await storage.getBloodRequest(requestId);
      if (!request || (!isStaff(req.user) && request.requesterId !== req.user!.id)) {
        return res.status(404).json({ error: "Blood request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blood request" });
    }
  });

  app.get("/api/blood-requests/status/:status", requireRole("hospital", "admin"), async (req, res) => {
    try {
      const requests = await storage.getBloodRequestsByStatus(
        req.params.status
      );
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blood requests" });
    }
  });

  app.post("/api/blood-requests", requireAuth, async (req, res) => {
    try {
      const payload = insertBloodRequestSchema.parse(req.body);
      if (req.user!.role !== "admin") {
        payload.requesterId = req.user!.id;
        // New requests always start pending; only hospitals move them forward
        payload.status = "pending";
      }
      console.log(`[DEBUG] Creating blood request for blood type: ${payload.bloodType}`);
      const request = await storage.createBloodRequest(payload);
      realtime.publishBloodRequest({
        type: "blood-request:created",
        payload: request,
      });
      
      res.status(201).json(request);
      matchmakingEngine.clearCache();
    } catch (error) {
      res.status(400).json({
        error:
          errorMessage(error, "Failed to create request"),
      });
    }
  });

  app.put("/api/blood-requests/:id", requireRole("hospital", "admin"), async (req, res) => {
    try {
      const requestId = req.params.id;
      console.log("[DEBUG] Updating blood request:", requestId, "with data:", req.body);

      const updates = insertBloodRequestSchema.partial().parse(req.body);
      
      // A hospital always acts as itself, whatever IDs the client sent
      if (req.user!.role === "hospital") {
        if (updates.approvedByHospitalId !== undefined) updates.approvedByHospitalId = req.user!.id;
        if (updates.fulfilledByHospitalId !== undefined) updates.fulfilledByHospitalId = req.user!.id;
      }
      
      const existing = await storage.getBloodRequest(requestId);
      if (!existing) {
        return res.status(404).json({ error: "Blood request not found" });
      }
      if (updates.status && updates.status !== existing.status &&
          (existing.status === "fulfilled" || existing.status === "rejected")) {
        return res.status(409).json({ error: `This request is already ${existing.status}` });
      }

      // Fulfilling a request uses up the fulfilling hospital's stock
      if (updates.status === "fulfilled" && existing.status !== "fulfilled" && req.user!.role === "hospital") {
        const consumed = await consumeInventory(req.user!.id, existing.bloodType, existing.quantity);
        if (!consumed) {
          return res.status(409).json({
            error: `Not enough unexpired ${existing.bloodType}-compatible blood in your inventory to fulfil ${existing.quantity} unit(s)`,
          });
        }
        updates.fulfilledByHospitalId = req.user!.id;
      }

      console.log("[DEBUG] Parsed updates:", updates);
      const request = await storage.updateBloodRequest(requestId, updates);
      
      if (!request) {
        console.log("[DEBUG] Blood request not found with ID:", requestId);
        return res.status(404).json({ error: "Blood request not found" });
      }
      
      console.log("[DEBUG] Successfully updated blood request:", request._id);
      realtime.publishBloodRequest({
        type: "blood-request:updated",
        payload: request,
      });
      matchmakingEngine.clearCache();
      res.json(request);
    } catch (error) {
      console.error("[ERROR] Failed to update blood request:", error);
      res.status(400).json({
        error:
          errorMessage(error, "Failed to update blood request"),
      });
    }
  });

  app.delete("/api/blood-requests/:id", requireAuth, async (req, res) => {
    try {
      const requestId = req.params.id;
      const existing = await storage.getBloodRequest(requestId);
      if (!existing || (req.user!.role !== "admin" && existing.requesterId !== req.user!.id)) {
        return res.status(404).json({ error: "Blood request not found" });
      }
      const deleted = await storage.deleteBloodRequest(requestId);
      if (!deleted) {
        return res.status(404).json({ error: "Blood request not found" });
      }
      matchmakingEngine.clearCache();
      realtime.publishBloodRequest({
        type: "blood-request:deleted",
        payload: { id: requestId },
      });
      res.json({ message: "Blood request deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete request" });
    }
  });

  // Send blood request notifications to eligible donors
  app.post("/api/blood-requests/:id/send-notifications", requireRole("hospital", "admin"), async (req, res) => {
    try {
      const requestId = req.params.id;
      console.log(`[DEBUG] === SEND NOTIFICATIONS START === RequestID: ${requestId}`);

      // Get the blood request
      const request = await storage.getBloodRequest(requestId);
      if (!request) {
        console.log(`[ERROR] Blood request not found: ${requestId}`);
        return res.status(404).json({ error: "Blood request not found" });
      }

      console.log(`[DEBUG] Blood Request Found: ${request.bloodType} from ${request.hospitalName}`);

      // Get compatible donor types
      const compatibleTypes = getCompatibleDonorTypes(request.bloodType);
      console.log(`[DEBUG] Compatible blood types for ${request.bloodType}: ${compatibleTypes.join(", ")}`);

      // Get eligible donors with emails
      const eligibleDonors = (
        await storage.getEligibleDonorsWithEmails(compatibleTypes, undefined)
      ).filter(({ donor }) => getDonorEligibility(donor).eligible);
      console.log(`[DEBUG] Found ${eligibleDonors.length} eligible donors`);

      if (eligibleDonors.length === 0) {
        console.log(`[WARNING] No eligible donors found for blood type ${request.bloodType}`);
        return res.status(200).json({
          message: "No eligible donors found for this blood type",
          sent: 0,
          failed: 0,
          donors: [],
        });
      }

      // Send emails to each donor
      let sentCount = 0;
      let failedCount = 0;
      const results = [];

      for (const { donor, email } of eligibleDonors) {
        try {
          console.log(`[DEBUG] Sending notification to: ${email} (${donor.firstName} ${donor.lastName})`);

          await sendBloodRequestNotification({
            donorEmail: email,
            donorName: `${donor.firstName} ${donor.lastName}`,
            bloodType: request.bloodType,
            urgency: request.urgency,
            hospitalName: request.hospitalName,
            requesterName: request.requesterName,
            country: request.country ?? undefined,
            state: (request.state || request.region) ?? undefined,
            district: request.region,
            address: request.address,
          });

          sentCount++;
          console.log(`[DEBUG] ✓ Email sent to: ${email}`);
          results.push({
            email,
            name: `${donor.firstName} ${donor.lastName}`,
            status: "sent",
          });
        } catch (error) {
          failedCount++;
          console.error(`[ERROR] Failed to send email to ${email}:`, error instanceof Error ? error.message : String(error));
          results.push({
            email,
            name: `${donor.firstName} ${donor.lastName}`,
            status: "failed",
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      console.log(`[DEBUG] === SEND NOTIFICATIONS COMPLETE === Sent: ${sentCount}, Failed: ${failedCount}`);
      log(`[INFO] Blood request notifications: ${sentCount} sent, ${failedCount} failed`);

      res.status(200).json({
        message: `Notifications sent to ${sentCount} donors (${failedCount} failed)`,
        sent: sentCount,
        failed: failedCount,
        total: eligibleDonors.length,
        results: results,
      });
    } catch (error) {
      console.error("[ERROR] Failed to send notifications:", error);
      res.status(500).json({
        error: errorMessage(error, "Failed to send notifications"),
      });
    }
  });

  app.get("/api/blood-requests/search/advanced", requireRole("hospital", "admin"), async (req, res) => {
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
  app.get("/api/donors", requireRole("hospital", "admin"), async (_req, res) => {
    try {
      const donors = await storage.getAllDonors();
      res.json(donors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch donors" });
    }
  });

  app.get("/api/donors/:id", requireRole("hospital", "admin"), async (req, res) => {
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

  app.get("/api/donors/bloodtype/:bloodType", requireRole("hospital", "admin"), async (req, res) => {
    try {
      const donors = await storage.getDonorsByBloodType(req.params.bloodType);
      res.json(donors);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch donors by blood type" });
    }
  });

  app.post("/api/donors", requireRole("admin"), async (req, res) => {
    try {
      const payload = insertDonorSchema.parse(req.body);
      const donor = await storage.createDonor(payload);
      matchmakingEngine.clearCache();
      res.status(201).json(donor);
    } catch (error) {
      res.status(400).json({
        error: errorMessage(error, "Failed to create donor"),
      });
    }
  });

  app.put("/api/donors/:id", requireRole("admin"), async (req, res) => {
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
        error: errorMessage(error, "Failed to update donor"),
      });
    }
  });

  app.delete("/api/donors/:id", requireRole("admin"), async (req, res) => {
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
    "/api/matchmaking/requests/:requestId/suggestions", requireRole("hospital", "admin"),
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
          errorMessage(error, "Failed to get donor suggestions");
        res.status(400).json({ error: message });
      }
    }
  );

  // ==================== INTER-HOSPITAL BLOOD SHARING ROUTES ====================
  app.get("/api/inter-hospital-blood/:direction/:hospitalId", requireSelfOr("hospitalId", "admin"), async (req, res) => {
    try {
      const { direction, hospitalId } = req.params;
      if (direction === "outgoing") {
        return res.json(await storage.getOutgoingInterHospitalRequests(hospitalId));
      }
      if (direction === "incoming") {
        return res.json(await storage.getIncomingInterHospitalRequests(hospitalId));
      }
      res.status(400).json({ error: "Direction must be 'incoming' or 'outgoing'" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inter-hospital requests" });
    }
  });

  app.post("/api/inter-hospital-blood", requireRole("hospital"), async (req, res) => {
    try {
      const payload = insertInterHospitalRequestSchema.parse({
        ...req.body,
        requestingHospitalId: req.user!.id,
      });
      const request = await storage.createInterHospitalRequest(payload);
      res.status(201).json(request);
    } catch (error) {
      res.status(400).json({
        error: errorMessage(error, "Failed to create inter-hospital request"),
      });
    }
  });

  app.put("/api/inter-hospital-blood/:id/accept", requireRole("hospital"), async (req, res) => {
    try {
      const providingHospitalId = req.user!.id;
      const { providingHospitalName } = req.body ?? {};
      const existing = await storage.getInterHospitalRequest(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Inter-hospital request not found" });
      }
      if (existing.status !== "pending") {
        return res.status(409).json({ error: `Request is already ${existing.status}` });
      }
      if (existing.requestingHospitalId === providingHospitalId) {
        return res.status(400).json({ error: "A hospital cannot accept its own request" });
      }
      const updated = await storage.updateInterHospitalRequest(req.params.id, {
        status: "accepted",
        providingHospitalId,
        providingHospitalName: providingHospitalName || null,
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to accept inter-hospital request" });
    }
  });

  app.put("/api/inter-hospital-blood/:id/reject", requireRole("hospital"), async (req, res) => {
    try {
      const existing = await storage.getInterHospitalRequest(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Inter-hospital request not found" });
      }
      if (existing.requestingHospitalId === req.user!.id) {
        return res.status(400).json({ error: "A hospital cannot reject its own request" });
      }
      if (existing.status !== "pending") {
        return res.status(409).json({ error: `Request is already ${existing.status}` });
      }
      const updated = await storage.updateInterHospitalRequest(req.params.id, {
        status: "rejected",
        rejectionReason: req.body?.rejectionReason || null,
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject inter-hospital request" });
    }
  });

  // Staff ID documents are sensitive, so only admins can view them
  app.get(
    "/uploads/staff_documents/:file",
    loadSessionUser,
    requireRole("admin"),
    (req, res) => {
      res.sendFile(path.basename(req.params.file), { root: uploadsDir }, (err) => {
        if (err && !res.headersSent) res.status(404).json({ error: "Document not found" });
      });
    },
  );

  // ==================== STAFF ROUTES ====================
  app.get("/api/staff", requireRole("hospital", "admin"), async (_req, res) => {
    try {
      const staffMembers = await storage.getAllStaff();
      res.json(staffMembers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  app.get("/api/staff/:id", requireRole("hospital", "admin"), async (req, res) => {
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
      // Admins can add staff directly; a newly registered hospital proves ownership
      // with the token returned by /api/register, and may only do so once.
      if (req.user?.role !== "admin") {
        const tokenUserId = readStaffProfileToken(req.body.staffProfileToken);
        if (!tokenUserId || tokenUserId !== payload.userId) {
          throw Object.assign(new Error("You do not have permission to perform this action"), { status: 403 });
        }
        const existingProfile = (await storage.getAllStaff()).find((s) => s.userId === payload.userId);
        if (existingProfile) {
          throw Object.assign(new Error("A staff profile already exists for this account"), { status: 409 });
        }
      }
      
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
      res.status((error as any)?.status ?? 400).json({
        error: errorMessage(error, "Failed to create staff"),
      });
    }
  });

  app.put("/api/staff/:id", requireRole("admin"), async (req, res) => {
    try {
      const updates = insertStaffSchema.partial().parse(req.body);
      const staff = await storage.updateStaff(req.params.id, updates);
      if (!staff) {
        return res.status(404).json({ error: "Staff member not found" });
      }
      res.json(staff);
    } catch (error) {
      res.status(400).json({
        error: errorMessage(error, "Failed to update staff"),
      });
    }
  });

  app.delete("/api/staff/:id", requireRole("admin"), async (req, res) => {
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
  app.get("/api/receivers", requireRole("hospital", "admin"), async (_req, res) => {
    try {
      const receivers = await storage.getAllReceivers();
      res.json(receivers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch receivers" });
    }
  });

  app.get("/api/receivers/:id", requireRole("hospital", "admin"), async (req, res) => {
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

  app.get("/api/receivers/blood-type/:bloodType", requireRole("hospital", "admin"), async (req, res) => {
    try {
      const receivers = await storage.getReceiversByBloodType(
        req.params.bloodType
      );
      res.json(receivers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch receivers by blood type" });
    }
  });

  app.post("/api/receivers", requireRole("admin"), async (req, res) => {
    try {
      const { id: _id, _id: _legacyId, ...payload } = req.body ?? {};
      const receiver = await storage.createReceiver(payload);
      res.status(201).json(receiver);
    } catch (error) {
      res.status(400).json({
        error: errorMessage(error, "Failed to create receiver"),
      });
    }
  });

  app.put("/api/receivers/:id", requireRole("admin"), async (req, res) => {
    try {
      const { id: _id, _id: _legacyId, ...updates } = req.body ?? {};
      const receiver = await storage.updateReceiver(req.params.id, updates);
      if (!receiver) {
        return res.status(404).json({ error: "Receiver not found" });
      }
      res.json(receiver);
    } catch (error) {
      res.status(400).json({
        error: errorMessage(error, "Failed to update receiver"),
      });
    }
  });

  app.delete("/api/receivers/:id", requireRole("admin"), async (req, res) => {
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

  // ==================== HOSPITAL MANAGEMENT ROUTES ====================
  app.get("/api/hospitals", requireRole("admin"), async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      const hospitalUsers = users.filter((u) => u.role === "hospital").map(removePassword);
      const allStaff = await storage.getAllStaff();
      const hospitals = hospitalUsers.map((user) => {
        const staffProfile = allStaff.find((s) => s.userId === (user as any)._id?.toString());
        return { ...user, staffProfile: staffProfile || null };
      });
      res.json(hospitals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hospitals" });
    }
  });

  app.post("/api/hospitals", requireRole("admin"), async (req, res) => {
    try {
      const { username, email, password, firstName, lastName, staffId, department, position, phone, hospitalName } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ error: "username, email, and password are required" });
      }
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) return res.status(409).json({ error: "Email already in use" });
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) return res.status(409).json({ error: "Username already in use" });

      const user = await storage.createUser({
        username,
        email,
        password,
        role: "hospital",
        // Created by an admin, so no separate approval step is needed
        approvalStatus: "approved",
      });
      const userId = (user as any).id || (user as any)._id;

      if (firstName && lastName && userId) {
        await storage.createStaff({
          userId: String(userId),
          firstName,
          lastName,
          staffId: staffId || "N/A",
          department: department || "General",
          position: position || "Staff",
          phone: phone || "",
          email,
          hospitalName: hospitalName || "",
        });
      }

      res.status(201).json(removePassword(user));
    } catch (error) {
      res.status(400).json({ error: errorMessage(error, "Failed to create hospital") });
    }
  });

  app.put("/api/hospitals/:id", requireRole("admin"), async (req, res) => {
    try {
      const { username, email, firstName, lastName, staffId, department, position, phone, hospitalName } = req.body;
      const userUpdates: Record<string, any> = {};
      if (username !== undefined) userUpdates.username = username;
      if (email !== undefined) userUpdates.email = email;
      if (Object.keys(userUpdates).length > 0) {
        await storage.updateUser(req.params.id, userUpdates);
      }
      const allStaff = await storage.getAllStaff();
      const staffProfile = allStaff.find((s) => s.userId === req.params.id);
      const staffUpdates: Record<string, any> = {};
      if (firstName !== undefined) staffUpdates.firstName = firstName;
      if (lastName !== undefined) staffUpdates.lastName = lastName;
      if (staffId !== undefined) staffUpdates.staffId = staffId;
      if (department !== undefined) staffUpdates.department = department;
      if (position !== undefined) staffUpdates.position = position;
      if (phone !== undefined) staffUpdates.phone = phone;
      if (hospitalName !== undefined) staffUpdates.hospitalName = hospitalName;
      if (email !== undefined) staffUpdates.email = email;
      if (Object.keys(staffUpdates).length > 0) {
        if (staffProfile?.id || staffProfile?._id) {
          await storage.updateStaff(String(staffProfile.id || staffProfile._id), staffUpdates);
        } else {
          await storage.createStaff({
            userId: req.params.id,
            firstName: firstName || "",
            lastName: lastName || "",
            staffId: staffId || "N/A",
            department: department || "General",
            position: position || "Staff",
            phone: phone || "",
            email: email || "",
            hospitalName: hospitalName || "",
          });
        }
      }
      const updatedUser = await storage.getUser(req.params.id);
      if (!updatedUser) return res.status(404).json({ error: "Hospital not found" });
      res.json(removePassword(updatedUser));
    } catch (error) {
      res.status(400).json({ error: errorMessage(error, "Failed to update hospital") });
    }
  });

  app.patch("/api/hospitals/:id/approve", requireRole("admin"), async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user || user.role !== "hospital") return res.status(404).json({ error: "Hospital not found" });
      await storage.updateUser(req.params.id, {
        approvalStatus: "approved",
      });
      res.json({ message: "Hospital approved successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to approve hospital" });
    }
  });

  app.patch("/api/hospitals/:id/reject", requireRole("admin"), async (req, res) => {
    try {
      const { reason } = req.body;
      const user = await storage.getUser(req.params.id);
      if (!user || user.role !== "hospital") return res.status(404).json({ error: "Hospital not found" });
      await storage.updateUser(req.params.id, {
        approvalStatus: "rejected",
        rejectionReason: reason || "",
      });
      res.json({ message: "Hospital registration rejected" });
    } catch (error) {
      res.status(500).json({ error: "Failed to reject hospital" });
    }
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
  app.get("/api/blood-expiry-alerts", requireRole("hospital", "admin"), async (_req, res) => {
    try {
      const alerts = await storage.getActiveBloodExpiryAlerts(false);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expiry alerts" });
    }
  });

  // Get alert summary (dashboard overview)
  app.get("/api/blood-expiry-alerts/summary", requireRole("hospital", "admin"), async (_req, res) => {
    try {
      const summary = await bloodExpiryService.getAlertSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alert summary" });
    }
  });

  // Get alerts by hospital
  app.get("/api/blood-expiry-alerts/hospital/:hospitalId", requireRole("hospital", "admin"), async (req, res) => {
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
  app.get("/api/blood-expiry-alerts/level/:level", requireRole("hospital", "admin"), async (req, res) => {
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
  app.get("/api/blood-expiry-alerts/:id", requireRole("hospital", "admin"), async (req, res) => {
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
  app.post("/api/blood-expiry-alerts/:id/acknowledge", requireRole("hospital", "admin"), async (req, res) => {
    try {
      const userId = req.user!.id;
      const { notes } = req.body ?? {};
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
  app.post("/api/blood-expiry-alerts/:id/resolve", requireRole("hospital", "admin"), async (req, res) => {
    try {
      const userId = req.user!.id;
      const { notes } = req.body ?? {};
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
  app.post("/api/blood-expiry-alerts/check/create", requireRole("hospital", "admin"), async (req, res) => {
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
  app.delete("/api/blood-expiry-alerts/:id", requireRole("admin"), async (req, res) => {
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

  // ==================== DONATION HISTORY ROUTES ====================
  const recordDonationSchema = z.object({
    donorIdentifier: z.string().trim().min(1, "Donor email or username is required"),
    units: z.coerce.number().int().min(1, "At least 1 unit").max(2, "At most 2 units per donation"),
    donationDate: z.coerce.date().optional(),
  });

  // A hospital records a donation it collected
  app.post("/api/donations/record", requireRole("hospital"), async (req, res) => {
    try {
      const { donorIdentifier, units, donationDate } = recordDonationSchema.parse(req.body);
      const staffProfile = (await storage.getAllStaff()).find((s) => s.userId === req.user!.id);
      const result = await donationHistoryService.recordDonation({
        donorIdentifier,
        units,
        donationDate,
        hospital: { id: req.user!.id, name: staffProfile?.hospitalName || req.user!.username },
      });
      matchmakingEngine.clearCache();
      res.status(201).json({ message: "Donation recorded successfully", ...result });
    } catch (error) {
      const status = error instanceof DonationError ? error.status : 400;
      res.status(status).json({ error: errorMessage(error, "Failed to record donation") });
    }
  });

  app.get("/api/donations/history/:donorId", requireSelfOr("donorId", "hospital", "admin"), async (req, res) => {
    try {
      res.json(await donationHistoryService.getDonationHistory(req.params.donorId));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch donation history" });
    }
  });

  app.get("/api/donations/stats/:donorId", requireSelfOr("donorId", "hospital", "admin"), async (req, res) => {
    try {
      res.json(await donationHistoryService.getDonationStats(req.params.donorId));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch donation statistics" });
    }
  });

  app.get("/api/donations/certificate/:donationId", requireAuth, async (req, res) => {
    try {
      const donation = await donationHistoryService.getDonation(req.params.donationId);
      if (!donation || (!isStaff(req.user) && donation.donorId !== req.user!.id)) {
        return res.status(404).json({ error: "Donation not found" });
      }
      res.type("html").send(donationHistoryService.renderCertificate(donation));
    } catch (error) {
      res.status(500).json({ error: "Failed to generate certificate" });
    }
  });

  // ==================== ELIGIBILITY REMINDER ROUTES ====================
  app.get("/api/eligibility/reminders/:donorId", requireSelfOr("donorId", "hospital", "admin"), async (req, res) => {
    try {
      const reminders = await eligibilityReminderService.getReminders(req.params.donorId);
      res.json({ reminders });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reminders" });
    }
  });

  // ==================== ACHIEVEMENT BADGE ROUTES ====================
  app.get("/api/badges/definitions", requireAuth, async (_req, res) => {
    try {
      res.json({ badges: await achievementBadgeService.getBadgeDefinitions() });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch badge definitions" });
    }
  });

  app.get("/api/badges/:donorId", requireSelfOr("donorId", "hospital", "admin"), async (req, res) => {
    try {
      res.json({ badges: await achievementBadgeService.getDonorBadges(req.params.donorId) });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch donor badges" });
    }
  });

  // ==================== BLOOD DONATION TRACKING ROUTES ====================
  // Get all blood donation tracking records
  app.get("/api/blood-donation-tracking", requireRole("hospital", "admin"), async (_req, res) => {
    try {
      const trackings = await storage.getAllBloodDonationTracking();
      res.json(trackings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blood donation tracking" });
    }
  });

  // Get tracking by ID
  app.get("/api/blood-donation-tracking/:id", requireAuth, async (req, res) => {
    try {
      const tracking = await storage.getBloodDonationTracking(req.params.id);
      if (!tracking) {
        return res.status(404).json({ error: "Tracking record not found" });
      }
      res.json(tracking);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tracking record" });
    }
  });

  // Get tracking records for a specific donor
  app.get("/api/blood-donation-tracking/donor/:donorId", requireSelfOr("donorId", "hospital", "admin"), async (req, res) => {
    try {
      const trackings = await storage.getBloodDonationTrackingByDonor(
        req.params.donorId
      );
      res.json(trackings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch donor tracking records" });
    }
  });

  // Get tracking records for a specific receiver
  app.get("/api/blood-donation-tracking/receiver/:receiverId", requireSelfOr("receiverId", "hospital", "admin"), async (req, res) => {
    try {
      const trackings = await storage.getBloodDonationTrackingByReceiver(
        req.params.receiverId
      );
      res.json(trackings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch receiver tracking records" });
    }
  });

  // Get tracking records by status
  app.get("/api/blood-donation-tracking/status/:status", requireRole("hospital", "admin"), async (req, res) => {
    try {
      const trackings = await storage.getBloodDonationTrackingByStatus(
        req.params.status
      );
      res.json(trackings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tracking records by status" });
    }
  });

  // Get tracking records for a specific hospital
  app.get("/api/blood-donation-tracking/hospital/:hospitalId", requireSelfOr("hospitalId", "admin"), async (req, res) => {
    try {
      const trackings = await storage.getBloodDonationTrackingByHospital(
        req.params.hospitalId
      );
      res.json(trackings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hospital tracking records" });
    }
  });

  // Create a new blood donation tracking record
  app.post("/api/blood-donation-tracking", requireRole("hospital", "admin"), async (req, res) => {
    try {
      const payload = {
        ...req.body,
        donationDate: req.body.donationDate ? new Date(req.body.donationDate) : new Date(),
        collectionTime: req.body.collectionTime ? new Date(req.body.collectionTime) : new Date(),
        transitStartTime: req.body.transitStartTime ? new Date(req.body.transitStartTime) : undefined,
        receivedTime: req.body.receivedTime ? new Date(req.body.receivedTime) : undefined,
        usageStartTime: req.body.usageStartTime ? new Date(req.body.usageStartTime) : undefined,
        transfusionCompleteTime: req.body.transfusionCompleteTime ? new Date(req.body.transfusionCompleteTime) : undefined,
      };
      const tracking = await storage.createBloodDonationTracking(payload);
      realtime.publishBloodRequest({
        type: "blood-donation-tracking:created",
        payload: tracking,
      });
      res.status(201).json(tracking);
    } catch (error) {
      res.status(400).json({
        error:
          errorMessage(error, "Failed to create tracking record"),
      });
    }
  });

  // Update a blood donation tracking record
  app.put("/api/blood-donation-tracking/:id", requireRole("hospital", "admin"), async (req, res) => {
    try {
      const payload = {
        ...req.body,
        donationDate: req.body.donationDate ? new Date(req.body.donationDate) : undefined,
        collectionTime: req.body.collectionTime ? new Date(req.body.collectionTime) : undefined,
        transitStartTime: req.body.transitStartTime ? new Date(req.body.transitStartTime) : undefined,
        receivedTime: req.body.receivedTime ? new Date(req.body.receivedTime) : undefined,
        usageStartTime: req.body.usageStartTime ? new Date(req.body.usageStartTime) : undefined,
        transfusionCompleteTime: req.body.transfusionCompleteTime ? new Date(req.body.transfusionCompleteTime) : undefined,
      };
      const tracking = await storage.updateBloodDonationTracking(
        req.params.id,
        payload
      );
      if (!tracking) {
        return res.status(404).json({ error: "Tracking record not found" });
      }
      realtime.publishBloodRequest({
        type: "blood-donation-tracking:updated",
        payload: tracking,
      });
      res.json(tracking);
    } catch (error) {
      res.status(400).json({
        error:
          errorMessage(error, "Failed to update tracking record"),
      });
    }
  });

  // Update blood donation tracking status
  app.post("/api/blood-donation-tracking/:id/update-status", requireRole("hospital", "admin"), async (req, res) => {
    try {
      const { status, note, updatedBy } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      const tracking = await storage.updateBloodDonationTrackingStatus(
        req.params.id,
        status,
        note,
        updatedBy
      );
      if (!tracking) {
        return res.status(404).json({ error: "Tracking record not found" });
      }
      realtime.publishBloodRequest({
        type: "blood-donation-tracking:status-updated",
        payload: tracking,
      });
      res.json(tracking);
    } catch (error) {
      res.status(400).json({
        error:
          errorMessage(error, "Failed to update tracking status"),
      });
    }
  });

  // Delete a blood donation tracking record
  app.delete("/api/blood-donation-tracking/:id", requireRole("hospital", "admin"), async (req, res) => {
    try {
      const deleted = await storage.deleteBloodDonationTracking(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Tracking record not found" });
      }
      res.json({ message: "Tracking record deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete tracking record" });
    }
  });

  return httpServer;
}
