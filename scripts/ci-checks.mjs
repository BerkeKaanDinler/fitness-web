import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
let hasError = false;

function fail(message) {
  console.error(`ERROR: ${message}`);
  hasError = true;
}

function info(message) {
  console.log(`OK: ${message}`);
}

function walkFiles(dir, out = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === ".vercel" || entry.name === "media") {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, out);
    } else if (entry.isFile()) {
      out.push(fullPath);
    }
  }
  return out;
}

function getRel(absolutePath) {
  return path.relative(root, absolutePath).replaceAll("\\", "/");
}

const requiredFiles = [
  "index.html",
  "styles.css",
  "script.js",
  "sw.js",
  "manifest.webmanifest",
  "icon.svg",
  "README.md",
];

for (const relPath of requiredFiles) {
  const absPath = path.join(root, relPath);
  if (!existsSync(absPath)) {
    fail(`Required file missing: ${relPath}`);
  }
}

const indexHtmlPath = path.join(root, "index.html");
const swPath = path.join(root, "sw.js");

if (existsSync(indexHtmlPath) && existsSync(swPath)) {
  const indexHtml = readFileSync(indexHtmlPath, "utf8");
  const swCode = readFileSync(swPath, "utf8");

  const styleVersion = indexHtml.match(/href="styles\.css\?v=(\d+)"/)?.[1];
  const scriptVersion = indexHtml.match(/src="script\.js\?v=(\d+)"/)?.[1];
  const swVersion = swCode.match(/const CACHE_NAME = "bkd-fitness-v(\d+)"/)?.[1];

  if (!styleVersion) fail("styles.css version tag not found in index.html");
  if (!scriptVersion) fail("script.js version tag not found in index.html");
  if (!swVersion) fail("Service worker CACHE_NAME version not found in sw.js");

  if (styleVersion && scriptVersion && styleVersion !== scriptVersion) {
    fail(`Version mismatch: styles v${styleVersion} and script v${scriptVersion}`);
  }

  if (styleVersion && swVersion && styleVersion !== swVersion) {
    fail(`Version mismatch: index v${styleVersion} and service worker v${swVersion}`);
  }

  if (styleVersion && !swCode.includes(`/styles.css?v=${styleVersion}`)) {
    fail("Service worker core assets missing versioned styles.css");
  }

  if (scriptVersion && !swCode.includes(`/script.js?v=${scriptVersion}`)) {
    fail("Service worker core assets missing versioned script.js");
  }

  const localRefs = new Set();
  const attrRegex = /(?:src|href)\s*=\s*["']([^"']+)["']/g;
  for (const match of indexHtml.matchAll(attrRegex)) {
    const rawRef = match[1].trim();
    if (!rawRef) continue;
    if (
      rawRef.startsWith("http://") ||
      rawRef.startsWith("https://") ||
      rawRef.startsWith("//") ||
      rawRef.startsWith("data:") ||
      rawRef.startsWith("mailto:") ||
      rawRef.startsWith("tel:") ||
      rawRef.startsWith("#")
    ) {
      continue;
    }

    const withoutQuery = rawRef.split("#")[0].split("?")[0];
    if (!withoutQuery) continue;
    const normalized = withoutQuery.replace(/^\/+/, "");
    localRefs.add(normalized);
  }

  for (const relRef of localRefs) {
    if (!existsSync(path.join(root, relRef))) {
      fail(`Local reference not found: ${relRef}`);
    }
  }

  if (!hasError) {
    info("Asset references and version consistency checks passed.");
  }
}

const leakPattern = /vcp_[A-Za-z0-9]{20,}/g;
const textExtensions = new Set([
  ".md",
  ".html",
  ".css",
  ".js",
  ".mjs",
  ".json",
  ".webmanifest",
  ".yml",
  ".yaml",
  ".txt",
  ".svg",
  ".gitignore",
]);

for (const filePath of walkFiles(root)) {
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath).toLowerCase();
  if (!textExtensions.has(ext) && !textExtensions.has(base)) {
    continue;
  }

  const fileSize = statSync(filePath).size;
  if (fileSize > 1_000_000) {
    continue;
  }

  const content = readFileSync(filePath, "utf8");
  const hit = content.match(leakPattern);
  if (hit) {
    fail(`Potential token leak in ${getRel(filePath)} -> ${hit[0].slice(0, 12)}...`);
  }
}

if (!hasError) {
  info("No token leak pattern found.");
}

if (hasError) {
  process.exit(1);
}

console.log("All CI checks passed.");
