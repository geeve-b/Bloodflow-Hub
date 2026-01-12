import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { connectDB } from "../config/db";
import { connectDatabase, closeDatabase } from "./db";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Add unhandled error handlers
process.on("uncaughtException", (error) => {
  console.error("[CRITICAL] Uncaught Exception:", error);
  // Don't exit, log and continue
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[CRITICAL] Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit, log and continue
});

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    await connectDB();
    // Connect to MongoDB
    await connectDatabase();

    // Setup error handler BEFORE routes
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.log("[DEBUG] Error handler caught:", message);
      res.status(status).json({ message });
    });
    
    await registerRoutes(httpServer, app);

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || "3000", 10);
    const host = "127.0.0.1";
    console.log(`[DEBUG] About to listen on ${host}:${port}`);
    
    // Use a timeout to ensure we don't wait forever
    let listenTimeoutHandle: NodeJS.Timeout;
    const listenPromise = new Promise<void>((resolve, reject) => {
      listenTimeoutHandle = setTimeout(() => {
        console.error("[DEBUG] Listen timeout - server failed to start listening!");
        reject(new Error("Listen timeout"));
      }, 5000);
      
      console.log("[DEBUG] Creating listener...");
      const listener = httpServer.listen(port, host, 128);
      
      console.log("[DEBUG] Setting up listen event handlers");
      listener.on("listening", () => {
        console.log("[DEBUG] Server is now LISTENING (listening event fired)");
        clearTimeout(listenTimeoutHandle);
        resolve();
      });
      
      listener.once("error", (err: any) => {
        console.error(`[DEBUG] Server error on listen:`, err);
        clearTimeout(listenTimeoutHandle);
        reject(err);
      });
      
      listener.on("close", () => {
        console.log("[DEBUG] httpServer closed!");
      });
    });
    
    await listenPromise;
    console.log("[DEBUG] Listen promise resolved - server should now be accessible");
    console.log("[DEBUG] Server is now running - process will stay alive due to active server handle");

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      console.log("[DEBUG] About to setup Vite...");
      const { setupVite } = await import("./vite");
      const viteTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Vite setup timeout")), 10000)
      );
      await Promise.race([setupVite(httpServer, app), viteTimeout]).catch((err) => {
        console.error("[DEBUG] Vite setup error (non-fatal):", err.message);
      });
      console.log("[DEBUG] Vite setup completed");
    }
    console.log("[DEBUG] Async initialization function ending");
    
    // IMPORTANT: Never return from this async IIFE so the process stays alive
    // Create a promise that never resolves
    await new Promise(() => {
      // This promise never resolves, keeping the process alive
    });
  } catch (error) {
    console.error("Server initialization error:", error);
    process.exit(1);
  }
})();
