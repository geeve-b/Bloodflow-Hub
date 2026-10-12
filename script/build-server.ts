import { build as esbuild } from "esbuild";
import { rm, readFile } from "fs/promises";
import { pathToFileURL } from "url";

// Server deps to bundle into dist/index.cjs (fewer files to resolve at cold start);
// everything else stays external and is loaded from node_modules.
const allowlist = [
  "date-fns",
  "drizzle-orm",
  "express",
  "multer",
  "nodemailer",
  "pg",
  "ws",
  "zod",
];

export async function bundleServer() {
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

// Run directly (npm run build:backend) to build only the API server
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  rm("dist", { recursive: true, force: true })
    .then(bundleServer)
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
