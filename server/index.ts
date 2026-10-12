import "dotenv/config";
import "./logger";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { connectDatabase } from "./db";
import { loadSessionUser } from "./auth";
import { scheduledTasksService } from "./scheduledTasks";

const app = express();
const httpServer = createServer(app);

// Behind nginx / a load balancer, trust X-Forwarded-* so secure cookies work over HTTPS
app.set("trust proxy", 1);
app.disable("x-powered-by");

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
app.use("/api", loadSessionUser);

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
    // Attempt PostgreSQL database connection
    console.log("[DEBUG] Attempting PostgreSQL database connection...");
    try {
      await connectDatabase();
    } catch (error) {
      console.warn("⚠ PostgreSQL connection failed, using fallback:", error);
    }
    console.log("[DEBUG] Database connection step completed");

    await registerRoutes(httpServer, app);

    // Unknown API routes must 404 as JSON instead of falling through to the SPA catch-all
    app.use("/api", (req, res) => {
      res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
    });

    // Error handler must be registered AFTER routes so it receives their errors
    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      if (res.headersSent) {
        return next(err);
      }
      const status = err.status || err.statusCode || (err.name === "MulterError" ? 400 : 500);
      const message = err.message || "Internal Server Error";

      console.log("[DEBUG] Error handler caught:", message);
      res.status(status).json({ error: message, message });
    });

    // Initialize scheduled tasks
    await scheduledTasksService.initialize();

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || "3000", 10);
    const host = process.env.HOST || "0.0.0.0";
    httpServer.listen(port, host, 128, () => {
      log(`serving on ${host}:${port}`);
    });
    httpServer.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use. Kill the existing process and retry.`);
        console.error(`Run: powershell -Command "Get-Process node | Stop-Process -Force"`);
        process.exit(1);
      } else {
        console.error(`Server error:`, err);
      }
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "production") {
      if (process.env.SERVE_STATIC !== "false") {
        serveStatic(app);
      }
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
