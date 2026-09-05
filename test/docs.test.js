"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

describe("deploy and listing docs", () => {
  test(".env.example lists APP_ID, PRIVATE_KEY, WEBHOOK_SECRET", () => {
    const text = fs.readFileSync(path.join(root, ".env.example"), "utf8");
    expect(text).toMatch(/^APP_ID=/m);
    expect(text).toMatch(/^PRIVATE_KEY=/m);
    expect(text).toMatch(/^WEBHOOK_SECRET=/m);
  });

  test("render.yaml is a web Node service with node server.js", () => {
    const text = fs.readFileSync(path.join(root, "render.yaml"), "utf8");
    expect(text).toMatch(/type:\s*web/);
    expect(text).toMatch(/runtime:\s*node/);
    expect(text).toMatch(/startCommand:\s*node server\.js/);
    expect(text).toMatch(/APP_ID/);
    expect(text).toMatch(/PRIVATE_KEY/);
    expect(text).toMatch(/WEBHOOK_SECRET/);
  });

  test("README has install, size rule, and privacy link", () => {
    const text = fs.readFileSync(path.join(root, "README.md"), "utf8");
    expect(text).toMatch(/2 clicks/i);
    expect(text).toMatch(/size\/XS/);
    expect(text).toMatch(/size\/XL/);
    expect(text).toMatch(/PRIVACY\.md/);
    expect(text).toMatch(/Tagline:/);
  });
});
