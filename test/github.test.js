"use strict";

const { generatePrivateKey } = require("./helpers");
const { octokitForInstallation } = require("../lib/github");

describe("octokitForInstallation", () => {
  test("returns an Octokit with rest.issues methods", async () => {
    const octokit = await octokitForInstallation({
      appId: 1,
      privateKey: generatePrivateKey(),
      installationId: 2,
    });

    expect(octokit.rest).toBeDefined();
    expect(typeof octokit.rest.issues.createLabel).toBe("function");
    expect(typeof octokit.rest.issues.addLabels).toBe("function");
    expect(typeof octokit.rest.issues.removeLabel).toBe("function");
    expect(typeof octokit.rest.issues.listLabelsOnIssue).toBe("function");
  });
});
