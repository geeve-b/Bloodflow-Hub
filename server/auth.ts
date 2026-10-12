import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { NextFunction, Request, Response } from "express";
import type { User } from "@shared/schema";
import { storage } from "./storage";

export type Role = "donor" | "receiver" | "hospital" | "admin";

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  approvalStatus: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

const SESSION_COOKIE = "lf_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const STAFF_PROFILE_TOKEN_TTL_MS = 30 * 60 * 1000;

// The primary admin account is identified by email, whatever role is stored for it.
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "bloodflowhub@gmail.com").trim().toLowerCase();

const SECRET = (() => {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  console.warn(
    "⚠ SESSION_SECRET is not set; using a random secret. Sessions will not survive a server restart.",
  );
  return randomBytes(32).toString("hex");
})();

const sign = (data: string) => createHmac("sha256", SECRET).update(data).digest("base64url");

function createToken(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function readToken<T extends { exp: number }>(token: string | undefined): T | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = Buffer.from(sign(body));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
    return typeof payload.exp === "number" && payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export function toSessionUser(user: User): SessionUser {
  const email = user.email.trim().toLowerCase();
  return {
    id: String(user.id || user._id),
    username: user.username,
    email: user.email,
    role: email === ADMIN_EMAIL ? "admin" : (user.role as Role),
    emailVerified: user.emailVerified,
    approvalStatus: user.approvalStatus ?? null,
  };
}

/** Returns an error message if this account may not sign in yet, otherwise null. */
export function loginBlockReason(user: SessionUser): string | null {
  if (user.role !== "hospital") return null;
  if (user.approvalStatus === "pending") {
    return "Your hospital registration is awaiting admin approval.";
  }
  if (user.approvalStatus === "rejected") {
    return "Your hospital registration was rejected. Please contact support.";
  }
  return null;
}

export function startSession(req: Request, res: Response, userId: string) {
  const secure = req.secure || req.headers["x-forwarded-proto"] === "https";
  res.cookie(SESSION_COOKIE, createToken({ sub: userId, exp: Date.now() + SESSION_TTL_MS }), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

export function endSession(res: Response) {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

/** Resolves the active account behind a Cookie header, if its session is valid. */
export async function getSessionUser(cookieHeader: string | undefined): Promise<SessionUser | undefined> {
  const session = readToken<{ sub: string; exp: number }>(readCookie(cookieHeader, SESSION_COOKIE));
  if (!session) return undefined;
  try {
    const user = await storage.getUser(session.sub);
    if (!user || !user.emailVerified) return undefined;
    const sessionUser = toSessionUser(user);
    return loginBlockReason(sessionUser) ? undefined : sessionUser;
  } catch (error) {
    console.error("[ERROR] Failed to load session user:", error);
    return undefined;
  }
}

/** Attaches req.user when the request carries a valid session for an active account. */
export async function loadSessionUser(req: Request, _res: Response, next: NextFunction) {
  req.user = await getSessionUser(req.headers.cookie);
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Please log in to continue" });
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Please log in to continue" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission to perform this action" });
    }
    next();
  };
}

/** Allows the user identified by the given route param, or any of the listed roles. */
export function requireSelfOr(param: string, ...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Please log in to continue" });
    if (req.user.id === req.params[param] || roles.includes(req.user.role)) return next();
    res.status(403).json({ error: "You do not have permission to perform this action" });
  };
}

export const isStaff = (user?: SessionUser) => user?.role === "hospital" || user?.role === "admin";

// A short-lived token that lets a just-registered hospital attach its staff profile
// (with ID document upload) before it has verified its email and logged in.
export const createStaffProfileToken = (userId: string) =>
  createToken({ sub: userId, purpose: "staff-profile", exp: Date.now() + STAFF_PROFILE_TOKEN_TTL_MS });

export function readStaffProfileToken(token: unknown): string | null {
  if (typeof token !== "string") return null;
  const payload = readToken<{ sub: string; purpose: string; exp: number }>(token);
  return payload?.purpose === "staff-profile" ? payload.sub : null;
}
