import * as esbuild from "esbuild";
import { execSync } from "child_process";
import { cpSync, rmSync, mkdirSync, writeFileSync, readFileSync } from "fs";

// Clean dist
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist/server", { recursive: true });
mkdirSync("dist/ui", { recursive: true });

const shared = {
  bundle: true,
  sourcemap: true,
  minify: false,
};

// Build all formats in parallel
await Promise.all([
  // Server ESM
  esbuild.build({
    ...shared,
    entryPoints: ["server/index.ts"],
    outfile: "dist/server/index.js",
    format: "esm",
    platform: "node",
    target: "node18",
    external: ["@mcp-ui/server", "esbuild"],
  }),
  // Server CJS
  esbuild.build({
    ...shared,
    entryPoints: ["server/index.ts"],
    outfile: "dist/server/index.cjs",
    format: "cjs",
    platform: "node",
    target: "node18",
    external: ["@mcp-ui/server", "esbuild"],
  }),
  // UI ESM
  esbuild.build({
    ...shared,
    entryPoints: ["ui/index.ts"],
    outfile: "dist/ui/index.js",
    format: "esm",
    platform: "browser",
    target: "es2020",
    external: ["react", "react-dom"],
  }),
  // UI CJS
  esbuild.build({
    ...shared,
    entryPoints: ["ui/index.ts"],
    outfile: "dist/ui/index.cjs",
    format: "cjs",
    platform: "browser",
    target: "es2020",
    external: ["react", "react-dom"],
  }),
]);

console.log("✅ JS builds complete");

// Generate TypeScript declarations
execSync("tsc -p tsconfig.build.json", { stdio: "inherit" });

// Copy .d.ts to .d.cts for CJS compatibility
cpSync("dist/server/index.d.ts", "dist/server/index.d.cts");
cpSync("dist/ui/index.d.ts", "dist/ui/index.d.cts");

// Remove internal declaration files (bundle, html)
rmSync("dist/server/bundle.d.ts", { force: true });
rmSync("dist/server/bundle.d.ts.map", { force: true });
rmSync("dist/server/html.d.ts", { force: true });
rmSync("dist/server/html.d.ts.map", { force: true });

console.log("✅ Type declarations complete");
console.log("✅ Build complete");
