import { build as viteBuild } from "vite";
import { rm } from "fs/promises";
import { bundleServer } from "./build-server";

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  await bundleServer();
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
