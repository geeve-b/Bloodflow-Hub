import "dotenv/config";
import "./logger";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { connectDB } from "../config/db";
import { connectDatabase, closeDatabase } from "./db";
import { scheduledTasksService } from "./scheduledTasks";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

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

    // Initialize scheduled tasks
    await scheduledTasksService.initialize();

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || "3000", 10);
    const host = "127.0.0.1";
    httpServer.listen(port, host, 128, () => {
      log(`serving on ${host}:${port}`);
    });
    httpServer.on("error", (err: any) => {
      console.error(`Server error:`, err);
    });

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
  } catch (error) {
    console.error("Server initialization error:", error);
    process.exit(1);
  }
})();
