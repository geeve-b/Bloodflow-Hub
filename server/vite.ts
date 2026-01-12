import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";

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
    // Don't handle API routes - let them fall through
    if (req.path.startsWith("/api/")) {
      return next();
    }

    const url = req.originalUrl;

    try {
      // Use fileURLToPath to properly convert import.meta.url to a file path
      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      const clientTemplate = path.resolve(currentDir, "..", "client", "index.html");

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
