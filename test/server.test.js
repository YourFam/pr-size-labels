"use strict";

jest.mock("../lib/label");

const request = require("supertest");
const { applySizeLabel } = require("../lib/label");
const { createAppServer } = require("../server");
const { generatePrivateKey, signBody, prPayload } = require("./helpers");

const SECRET = "test-webhook-secret";
const privateKey = generatePrivateKey();

describe("webhook server", () => {
  let server;

  beforeAll(async () => {
    ({ server } = await createAppServer({
      appId: 1,
      privateKey,
      secret: SECRET,
      githubToken: "test-token",
      webhooksPath: "/",
      logLevel: "fatal",
    }));
  });

  afterAll(async () => {
    if (server && server.close) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  beforeEach(() => {
    applySizeLabel.mockReset();
    applySizeLabel.mockResolvedValue(undefined);
  });

  async function postEvent(eventName, payload, opts = {}) {
    const body = opts.raw ?? JSON.stringify(payload);
    const sig = Object.prototype.hasOwnProperty.call(opts, "signature")
      ? opts.signature
      : signBody(SECRET, body);
    const req = request(server)
      .post("/")
      .set("Content-Type", "application/json")
      .set("X-GitHub-Event", eventName)
      .set("X-GitHub-Delivery", "00000000-0000-0000-0000-000000000001");
    if (sig !== null && sig !== undefined) {
      req.set("X-Hub-Signature-256", sig);
    }
    return req.send(body);
  }

  test("opened PR with additions:30 deletions:10 applies size/M and replaces prior size/*", async () => {
    const payload = prPayload({ action: "opened", additions: 30, deletions: 10 });
    const res = await postEvent("pull_request", payload);
    expect(res.status).toBe(200);
    expect(applySizeLabel).toHaveBeenCalledTimes(1);
    expect(applySizeLabel).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        owner: "YourFam",
        repo: "demo",
        issue_number: 1,
        label: "size/M",
      })
    );
  });

  test("synchronize is handled", async () => {
    const payload = prPayload({
      action: "synchronize",
      additions: 30,
      deletions: 10,
    });
    const res = await postEvent("pull_request", payload);
    expect(res.status).toBe(200);
    expect(applySizeLabel).toHaveBeenCalledTimes(1);
  });

  test("reopened is handled", async () => {
    const payload = prPayload({ action: "reopened", additions: 1, deletions: 0 });
    const res = await postEvent("pull_request", payload);
    expect(res.status).toBe(200);
    expect(applySizeLabel).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ label: "size/XS" })
    );
  });

  test("pull_request.edited is a 200 no-op", async () => {
    const payload = prPayload({ action: "edited", additions: 30, deletions: 10 });
    const res = await postEvent("pull_request", payload);
    expect(res.status).toBe(200);
    expect(applySizeLabel).not.toHaveBeenCalled();
  });

  test("unknown pull_request action is a 200 no-op", async () => {
    const payload = prPayload({ action: "assigned", additions: 30, deletions: 10 });
    const res = await postEvent("pull_request", payload);
    expect(res.status).toBe(200);
    expect(applySizeLabel).not.toHaveBeenCalled();
  });

  test("issue event is a 200 no-op", async () => {
    const payload = {
      action: "opened",
      installation: { id: 2 },
      issue: { number: 1 },
      repository: { name: "demo", owner: { login: "YourFam" } },
    };
    const res = await postEvent("issues", payload);
    expect(res.status).toBe(200);
    expect(applySizeLabel).not.toHaveBeenCalled();
  });

  test("missing X-Hub-Signature-256 → 401, no mutations", async () => {
    const payload = prPayload();
    const res = await postEvent("pull_request", payload, { signature: null });
    expect(res.status).toBe(401);
    expect(applySizeLabel).not.toHaveBeenCalled();
  });

  test("bad X-Hub-Signature-256 → 401, no mutations", async () => {
    const payload = prPayload();
    const res = await postEvent("pull_request", payload, {
      signature: "sha256=deadbeef",
    });
    expect(res.status).toBe(401);
    expect(applySizeLabel).not.toHaveBeenCalled();
  });

  test("additions:null → 200, no label mutation", async () => {
    const payload = prPayload({ additions: null, deletions: 10 });
    const res = await postEvent("pull_request", payload);
    expect(res.status).toBe(200);
    expect(applySizeLabel).not.toHaveBeenCalled();
  });

  test("deletions:null → 200, no label mutation", async () => {
    const payload = prPayload({ additions: 10, deletions: null });
    const res = await postEvent("pull_request", payload);
    expect(res.status).toBe(200);
    expect(applySizeLabel).not.toHaveBeenCalled();
  });
});
