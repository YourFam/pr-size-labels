"use strict";

const http = require("http");
const crypto = require("crypto");
const { sizeFromCounts } = require("./lib/size");
const { applySizeLabel } = require("./lib/label");

const DEFAULT_WEBHOOK_PATH = "/";
const HANDLED_PR_ACTIONS = new Set(["opened", "synchronize", "reopened"]);

function normalizePath(pathname) {
  if (!pathname || pathname === "") {
    return "/";
  }
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function verifySignature(secret, rawBody, header) {
  if (!secret || !header || typeof header !== "string") {
    return false;
  }
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", String(secret)).update(rawBody).digest("hex");
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

function readBody(req) {
  if (typeof req.body === "string") {
    return Promise.resolve(Buffer.from(req.body));
  }
  if (Buffer.isBuffer(req.body)) {
    return Promise.resolve(req.body);
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function handlePullRequest(context) {
  const action = context.payload.action;
  if (!HANDLED_PR_ACTIONS.has(action)) {
    return;
  }

  const pr = context.payload.pull_request;
  if (!pr) {
    return;
  }

  const size = sizeFromCounts(pr.additions, pr.deletions);
  if (!size) {
    return;
  }

  const { owner, repo } = context.repo();
  await applySizeLabel(context.octokit, {
    owner,
    repo,
    issue_number: pr.number,
    label: size.name,
  });
}

async function handleMarketplace() {
  // Free listing: acknowledge plan-change hooks. No billing, no seats.
}

function appFn(app) {
  app.on(
    ["pull_request.opened", "pull_request.synchronize", "pull_request.reopened"],
    handlePullRequest
  );
  // GitHub requires Marketplace plan-change deliveries on App listings, even when free.
  app.on("marketplace_purchase", handleMarketplace);
}

async function createAppServer(options = {}) {
  const { createProbot, createNodeMiddleware } = await import("probot");

  const secret = options.secret ?? process.env.WEBHOOK_SECRET;
  const webhooksPath = normalizePath(
    options.webhooksPath ?? process.env.WEBHOOK_PATH ?? DEFAULT_WEBHOOK_PATH
  );

  const overrides = {
    appId: options.appId ?? process.env.APP_ID,
    privateKey: options.privateKey ?? process.env.PRIVATE_KEY,
    secret,
    logLevel: options.logLevel ?? "warn",
  };
  if (options.githubToken) {
    overrides.githubToken = options.githubToken;
  }

  const probot = createProbot({ overrides });
  const inner = await createNodeMiddleware(appFn, { probot, webhooksPath });

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://localhost");
      const pathname = normalizePath(url.pathname);

      if (req.method === "POST" && pathname === webhooksPath) {
        const raw = await readBody(req);
        const signature = req.headers["x-hub-signature-256"];
        if (!verifySignature(secret, raw, signature)) {
          res.writeHead(401, { "content-type": "text/plain" }).end("unauthorized\n");
          return;
        }
        req.body = Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw);
        const handled = await inner(req, res, () => {
          if (!res.headersSent) {
            res.writeHead(404).end("not found\n");
          }
        });
        if (!handled && !res.headersSent) {
          res.writeHead(404).end("not found\n");
        }
        return;
      }

      const handled = await inner(req, res, () => {
        if (!res.headersSent) {
          res.writeHead(404).end("not found\n");
        }
      });
      if (!handled && !res.headersSent) {
        res.writeHead(404).end("not found\n");
      }
    } catch (error) {
      if (!res.headersSent) {
        res.writeHead(500, { "content-type": "text/plain" }).end("error\n");
      }
    }
  });

  return { server, probot, webhooksPath };
}

async function start() {
  const { server, webhooksPath } = await createAppServer();
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || "0.0.0.0";
  await new Promise((resolve) => server.listen(port, host, resolve));
  console.log(
    `PR Size Labels listening on ${host}:${port} (webhook ${webhooksPath})`
  );
  return server;
}

if (require.main === module) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  app: appFn,
  appFn,
  createAppServer,
  handlePullRequest,
  start,
  verifySignature,
};
