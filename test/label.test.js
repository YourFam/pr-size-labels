"use strict";

const { applySizeLabel, ensureSizeLabels } = require("../lib/label");
const { SIZE_LABELS } = require("../lib/size");

function mockOctokit({ labelsOnIssue = [], createLabelImpl } = {}) {
  const calls = {
    createLabel: [],
    listLabelsOnIssue: [],
    removeLabel: [],
    addLabels: [],
  };

  const issues = {
    createLabel: jest.fn(async (args) => {
      calls.createLabel.push(args);
      if (createLabelImpl) {
        return createLabelImpl(args);
      }
      return { data: args };
    }),
    listLabelsOnIssue: jest.fn(async (args) => {
      calls.listLabelsOnIssue.push(args);
      return { data: labelsOnIssue };
    }),
    removeLabel: jest.fn(async (args) => {
      calls.removeLabel.push(args);
      return { data: {} };
    }),
    addLabels: jest.fn(async (args) => {
      calls.addLabels.push(args);
      return { data: [] };
    }),
  };

  return { octokit: { issues }, calls, issues };
}

const repo = { owner: "YourFam", repo: "demo", issue_number: 7 };

describe("ensureSizeLabels", () => {
  test("creates the five labels with exact names and colors when absent", async () => {
    const { octokit, calls } = mockOctokit();
    await ensureSizeLabels(octokit, repo.owner, repo.repo);

    expect(calls.createLabel).toHaveLength(5);
    expect(calls.createLabel).toEqual(
      SIZE_LABELS.map(({ name, color }) => ({
        owner: "YourFam",
        repo: "demo",
        name,
        color,
      }))
    );
  });

  test("treats 422 as already-exists and continues", async () => {
    const { octokit, calls } = mockOctokit({
      createLabelImpl: async () => {
        const error = new Error("already exists");
        error.status = 422;
        throw error;
      },
    });
    await ensureSizeLabels(octokit, repo.owner, repo.repo);
    expect(calls.createLabel).toHaveLength(5);
  });

  test("rethrows non-422 create errors", async () => {
    const { octokit } = mockOctokit({
      createLabelImpl: async () => {
        const error = new Error("boom");
        error.status = 500;
        throw error;
      },
    });
    await expect(ensureSizeLabels(octokit, repo.owner, repo.repo)).rejects.toThrow(
      "boom"
    );
  });
});

describe("applySizeLabel", () => {
  test("removes existing size/* then adds the new one (no stacking)", async () => {
    const { octokit, calls } = mockOctokit({
      labelsOnIssue: [
        { name: "size/S" },
        { name: "size/L" },
        { name: "bug" },
      ],
    });

    await applySizeLabel(octokit, { ...repo, label: "size/M" });

    expect(calls.removeLabel.map((c) => c.name).sort()).toEqual([
      "size/L",
      "size/S",
    ]);
    expect(calls.addLabels).toEqual([
      {
        owner: "YourFam",
        repo: "demo",
        issue_number: 7,
        labels: ["size/M"],
      },
    ]);
  });

  test("does not touch non-size labels", async () => {
    const { octokit, calls } = mockOctokit({
      labelsOnIssue: [{ name: "bug" }, { name: "needs-review" }],
    });

    await applySizeLabel(octokit, { ...repo, label: "size/XS" });

    expect(calls.removeLabel).toEqual([]);
    expect(calls.addLabels[0].labels).toEqual(["size/XS"]);
  });

  test("does not re-add the label when it is already the only size/*", async () => {
    const { octokit, calls } = mockOctokit({
      labelsOnIssue: [{ name: "size/M" }, { name: "bug" }],
    });

    await applySizeLabel(octokit, { ...repo, label: "size/M" });

    expect(calls.removeLabel).toEqual([]);
    expect(calls.addLabels).toEqual([]);
  });

  test("replacement when the PR grows to a new bucket", async () => {
    const { octokit, calls } = mockOctokit({
      labelsOnIssue: [{ name: "size/S" }],
    });

    await applySizeLabel(octokit, { ...repo, label: "size/XL" });

    expect(calls.removeLabel).toEqual([
      {
        owner: "YourFam",
        repo: "demo",
        issue_number: 7,
        name: "size/S",
      },
    ]);
    expect(calls.addLabels[0].labels).toEqual(["size/XL"]);
  });

  test("creates missing size labels before applying", async () => {
    const { octokit, calls } = mockOctokit({ labelsOnIssue: [] });
    await applySizeLabel(octokit, { ...repo, label: "size/L" });
    expect(calls.createLabel).toHaveLength(5);
    expect(calls.createLabel.map((c) => c.color)).toEqual(
      SIZE_LABELS.map((b) => b.color)
    );
  });
});
