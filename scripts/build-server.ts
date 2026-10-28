import { build } from "bun";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

async function runBuild() {
  console.log("🚀 Starting optimized Bun server build...");

  const outDir = join(import.meta.dirname, "../dist/app/server");
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const result = await build({
    entrypoints: ["src/server.ts"],
    outdir: "dist/app/server",
    target: "node", // Bun's node target is highly compatible and fast
    format: "esm",
    minify: true,
    sourcemap: "external",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    // We keep these external to let Bun/Node handle them at runtime
    external: [
      "@angular/ssr/node",
      "express",
      "@google/genai",
      "appwrite",
      "node-appwrite",
      "@libsql/client"
    ],
  });

  if (!result.success) {
    console.error("❌ Bun build failed:");
    for (const message of result.logs) {
      console.error(message);
    }
    process.exit(1);
  }

  console.log("✅ Bun server build complete!");
}

runBuild();
