// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

const legacyFileAllowlist = new Set([
  "/index.html",
  "/legacy-preview.html",
  "/style.css",
  "/main.mp4",
  "/robots.txt",
  "/sitemap.xml",
]);

const legacyFolderPrefixes = ["/assets/", "/data/", "/js/"];

function getContentType(filePath: string) {
  switch (extname(filePath).toLowerCase()) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    case ".mp4":
      return "video/mp4";
    case ".ico":
      return "image/x-icon";
    default:
      return "application/octet-stream";
  }
}

function legacyStaticPreviewPlugin(): Plugin {
  return {
    name: "vextro-legacy-static-preview",
    enforce: "pre",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (!request.url) {
          next();
          return;
        }

        let pathname: string;
        try {
          pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
        } catch {
          next();
          return;
        }

        const shouldServeLegacyFile =
          legacyFileAllowlist.has(pathname) ||
          legacyFolderPrefixes.some((prefix) => pathname.startsWith(prefix));

        if (!shouldServeLegacyFile) {
          next();
          return;
        }

        const relativePath = pathname === "/legacy-preview.html" ? "index.html" : pathname.slice(1);
        const normalizedPath = normalize(relativePath);
        if (normalizedPath.startsWith("..")) {
          next();
          return;
        }

        const filePath = join(projectRoot, normalizedPath);
        if (!filePath.startsWith(projectRoot)) {
          next();
          return;
        }

        const fileStats = await stat(filePath).catch(() => undefined);
        if (!fileStats?.isFile()) {
          next();
          return;
        }

        response.statusCode = 200;
        response.setHeader("content-type", getContentType(filePath));
        response.setHeader("cache-control", "no-cache");
        createReadStream(filePath).pipe(response);
      });
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // Keep Vite from treating the whole repo root as public assets. Serving "." was shadowing
    // transformed /src CSS in the Lovable preview, which could make the page fall back to raw HTML.
    publicDir: false,
    plugins: [legacyStaticPreviewPlugin()],
  },
});
