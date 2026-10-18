import { spawnSync } from "node:child_process";
import { constants } from "node:fs";
import { lstat, open, readdir } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = new Set();
const findingFiles = new Map();
const skippedBinaryFiles = new Set();
const scannedFiles = new Set();
const excludedDirectories = new Set([".git", "node_modules", ".wrangler"]);
const allowedEmailDomains = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test",
  "invalid",
]);

const atSign = String.fromCharCode(64);
const dot = String.fromCharCode(46);
const escapedDot = `\\${dot}`;
const slash = String.fromCharCode(47);
const dashes = "-".repeat(5);
const emailPattern = new RegExp(
  String.raw`(?<![A-Z0-9.!#$%&'*+/=?^_{|}~-])([A-Z0-9.!#$%&'*+/=?^_{|}~-]+)${atSign}([A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:${escapedDot}[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)*)`,
  "gi",
);
const personalPathPattern = new RegExp(`${slash}Users${slash}`, "i");
const privateKeyPattern = new RegExp(
  `${dashes}BEGIN\\s+(?:(?:RSA|EC|OPENSSH|DSA)\\s+)?PRIVATE KEY${dashes}`,
  "i",
);
const credentialPatterns = [
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bAIza[0-9A-Za-z_-]{35}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{20,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  /\beyJ[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{8,}\b/,
  /\bBearer\s+[A-Za-z0-9._~+/-]{24,}={0,2}\b/i,
  /(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\s*['"]?\s*[:=]\s*['"][^\s'"]{16,}['"]/i,
  privateKeyPattern,
];

const projectIdKey = ["project", "id"].join("_");
const siteIdKey = ["site", "id"].join("_");
const projectIdCamel = "project" + "Id";
const siteIdCamel = "site" + "Id";
const sitesIdPattern = new RegExp(
  `(?:["']?(?:${projectIdKey}|${siteIdKey}|${projectIdCamel}|${siteIdCamel})["']?\\s*[:=]\\s*)(["'])([A-Za-z0-9][A-Za-z0-9_-]{5,})\\1`,
  "gi",
);
const sitesUrlPattern = new RegExp(
  `(?:chatgpt\\.com|openai\\.com)\\/(?:sites|projects)\\/([A-Za-z0-9_-]{8,})`,
  "gi",
);
const sitesIdPrefixes = ["site", "project"].map((value) => new RegExp(`\\b${value}[-_][A-Za-z0-9_-]{12,}\\b`, "gi"));
const opaqueSitesPrefixes = [
  ["appgpr", "j"],
  ["appgve", "r"],
  ["appgde", "p"],
].map((parts) => new RegExp(`\\b${parts.join("")}_`, "gi"));
const placeholderSiteIds = new Set([
  "your_sites_project_id",
  "your-site-project-id",
  "your_project_id",
  "replace_me",
  "placeholder",
]);

function normalizedRelativePath(absolutePath) {
  return relative(projectRoot, absolutePath).split(sep).join("/");
}

function isPrivatePath(relativePath) {
  const parts = relativePath.split("/").filter(Boolean);
  return parts.some((part) =>
    part === ".private" ||
    part === ".agent" ||
    part.startsWith(".env") ||
    part.startsWith(".dev.vars"),
  ) || relativePath === ".openai/hosting.json";
}

function isExcludedPath(relativePath) {
  if (isPrivatePath(relativePath)) return true;
  const parts = relativePath.split("/").filter(Boolean);
  return parts.some((part) => excludedDirectories.has(part) || part === ".DS_Store");
}

function recordFailure(rule, relativePath) {
  failures.add(rule);
  if (relativePath) {
    const files = findingFiles.get(rule) ?? new Set();
    files.add(relativePath);
    findingFiles.set(rule, files);
  }
}

async function getTrackedPaths() {
  const gitPath = join(projectRoot, ".git");
  try {
    await lstat(gitPath);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    recordFailure("could not inspect Git metadata");
    return [];
  }

  const result = spawnSync("git", ["-C", projectRoot, "ls-files", "-z"], {
    encoding: "buffer",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    recordFailure("could not enumerate Git-tracked paths");
    return [];
  }

  return result.stdout.toString("utf8").split("\0").filter(Boolean);
}

async function walkPublicTree(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    const relativePath = normalizedRelativePath(absolutePath);
    if (isExcludedPath(relativePath)) continue;

    if (entry.isSymbolicLink()) {
      recordFailure("symlink paths require review");
      continue;
    }
    if (entry.isDirectory()) {
      await walkPublicTree(absolutePath);
      continue;
    }
    if (entry.isFile()) {
      scannedFiles.add(relativePath);
      continue;
    }
    recordFailure("special filesystem entries require review");
  }
}

function hasUnsafeSiteId(text) {
  for (const match of text.matchAll(sitesIdPattern)) {
    const value = match[2].toLowerCase();
    if (!placeholderSiteIds.has(value)) return true;
  }
  if (sitesUrlPattern.test(text)) return true;
  sitesUrlPattern.lastIndex = 0;
  return [...sitesIdPrefixes, ...opaqueSitesPrefixes].some((pattern) => {
    const found = pattern.test(text);
    pattern.lastIndex = 0;
    return found;
  });
}

function inspectText(text, relativePath) {
  let hasRealEmail = false;
  for (const match of text.matchAll(emailPattern)) {
    const domain = match[2].toLowerCase();
    if (
      allowedEmailDomains.has(domain) ||
      domain.endsWith(".test") ||
      domain.endsWith(".invalid") ||
      domain.endsWith(".example")
    ) continue;
    const atIndex = match.index + match[0].indexOf(atSign);
    if (domain === "media" && text[atIndex - 1] === "}" && text[atIndex + domain.length + 1] === "(") continue;
    if (!domain.includes(dot) && /^v\d+(?:\.\d+)*$/.test(domain)) continue;
    hasRealEmail = true;
  }
  emailPattern.lastIndex = 0;
  if (hasRealEmail) recordFailure("real email addresses detected", relativePath);

  if (credentialPatterns.some((pattern) => pattern.test(text))) {
    recordFailure("credential-shaped values detected", relativePath);
  }
  if (personalPathPattern.test(text)) recordFailure("local user paths detected", relativePath);
  if (hasUnsafeSiteId(text)) recordFailure("ChatGPT Sites identifiers detected", relativePath);
  if (relativePath === "worker/candidates.js") {
    const source = text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "").trim();
    if (source !== "export const candidates = [];") {
      recordFailure("public candidate fallback is not empty", relativePath);
    }
  }
}

async function readWithoutFollowingSymlinks(absolutePath) {
  const noFollow = constants.O_NOFOLLOW ?? 0;
  const handle = await open(absolutePath, constants.O_RDONLY | noFollow);
  try {
    const stat = await handle.stat();
    if (!stat.isFile()) {
      recordFailure("non-file entries require review");
      return null;
    }
    return await handle.readFile();
  } finally {
    await handle.close();
  }
}

async function scanFile(relativePath) {
  if (isExcludedPath(relativePath)) return;
  const absolutePath = resolve(projectRoot, relativePath);
  if (!absolutePath.startsWith(projectRoot + sep)) {
    recordFailure("paths outside the project root require review");
    return;
  }

  try {
    const stat = await lstat(absolutePath);
    if (stat.isSymbolicLink()) {
      recordFailure("symlink paths require review");
      return;
    }
  } catch (error) {
    if (error.code === "ENOENT") return;
    recordFailure("a public path could not be inspected");
    return;
  }

  let buffer;
  try {
    buffer = await readWithoutFollowingSymlinks(absolutePath);
  } catch (error) {
    if (error.code === "ELOOP") recordFailure("symlink paths require review");
    else recordFailure("a public file could not be read");
    return;
  }
  if (!buffer || buffer.includes(0)) {
    if (buffer) skippedBinaryFiles.add(relativePath);
    return;
  }

  inspectText(buffer.toString("utf8"), relativePath);
}

const trackedPaths = await getTrackedPaths();
if (trackedPaths !== null) {
  for (const relativePath of trackedPaths) {
    if (isPrivatePath(relativePath)) {
      recordFailure("Git tracks a private or deployment-config path");
      continue;
    }
    const absolutePath = resolve(projectRoot, relativePath);
    if (!absolutePath.startsWith(projectRoot + sep)) {
      recordFailure("Git tracks a path outside the project root");
      continue;
    }
    try {
      if ((await lstat(absolutePath)).isSymbolicLink()) {
        recordFailure("Git tracks a symlink path");
        continue;
      }
    } catch (error) {
      if (error.code !== "ENOENT") recordFailure("a Git-tracked path could not be inspected");
    }
  }
}

await walkPublicTree(projectRoot);
for (const relativePath of scannedFiles) await scanFile(relativePath);

if (trackedPaths === null) {
  process.stdout.write("Git metadata is absent; checked the local public tree only.\n");
}
process.stdout.write(`Scanned ${scannedFiles.size} public text files.\n`);
if (skippedBinaryFiles.size) {
  process.stdout.write(`Skipped ${skippedBinaryFiles.size} binary file(s).\n`);
}
if (failures.size) {
  process.stderr.write(`Privacy check failed: ${[...failures].join("; ")}. Values and paths are omitted.\n`);
  if (process.argv.includes("--show-filenames")) {
    for (const [rule, files] of findingFiles) {
      process.stderr.write(`${rule}: ${[...files].join(", ")}\n`);
    }
  }
  process.exitCode = 1;
} else {
  process.stdout.write("Privacy check passed.\n");
}
