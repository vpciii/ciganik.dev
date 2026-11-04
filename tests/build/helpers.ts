import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export const DIST = join(import.meta.dirname, "..", "..", "dist");

export function requireDist(): void {
  if (!existsSync(join(DIST, "index.html"))) {
    throw new Error("dist/ is missing — run `npm run build` first (or `npm run test:build`).");
  }
}

export function htmlFiles(dir = DIST): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return htmlFiles(p);
    return p.endsWith(".html") ? [p] : [];
  });
}

export function read(path: string): string {
  return readFileSync(path, "utf8");
}

export function rel(path: string): string {
  return relative(DIST, path);
}
