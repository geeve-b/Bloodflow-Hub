import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export async function setupVite(server: Server, app: Express) {
  console.log("[DEBUG] setupVite function called");
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };

  console.log("[DEBUG] Creating Vite server...");
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  console.log("[DEBUG] Adding Vite middlewares to Express...");
  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    // Don't handle API routes or uploaded files - let them fall through
    if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) {
      console.log("[DEBUG] Vite catch-all skipping route:", req.originalUrl);
      return next();
    }

    console.log("[DEBUG] Vite catch-all route serving index.html for:", req.originalUrl);
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      console.log("[DEBUG] Error in Vite catch-all:", e);
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
  console.log("[DEBUG] setupVite function complete");
}
