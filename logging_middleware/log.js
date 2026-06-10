const API_BASE_URL = process.env.EVALUATION_API_BASE_URL || "http://4.224.186.213/evaluation-service";

const VALID_STACKS = new Set(["backend", "frontend"]);
const VALID_LEVELS = new Set(["debug", "info", "warn", "error", "fatal"]);
const VALID_PACKAGES = new Set([
  "api",
  "auth",
  "cache",
  "component",
  "config",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "hook",
  "middleware",
  "page",
  "repository",
  "route",
  "service",
  "state",
  "style",
  "utils",
]);

function assertAllowed(field, value, allowed) {
  if (!allowed.has(value)) {
    throw new Error(`${field} must be one of: ${Array.from(allowed).join(", ")}`);
  }
}

async function Log(stack, level, packageName, message, options = {}) {
  assertAllowed("stack", stack, VALID_STACKS);
  assertAllowed("level", level, VALID_LEVELS);
  assertAllowed("package", packageName, VALID_PACKAGES);

  if (!message || typeof message !== "string") {
    throw new Error("message must be a non-empty string");
  }

  const token = options.token || process.env.EVALUATION_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Missing access token. Set EVALUATION_ACCESS_TOKEN or pass { token }.");
  }

  const response = await fetch(`${API_BASE_URL}/logs`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      stack,
      level,
      package: packageName,
      message,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Log API failed with ${response.status}: ${JSON.stringify(payload)}`);
  }

  return payload;
}

module.exports = { Log };
