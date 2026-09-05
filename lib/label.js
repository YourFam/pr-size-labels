"use strict";

const { SIZE_LABELS } = require("./size");

const SIZE_PREFIX = "size/";

function issuesApi(octokit) {
  if (octokit.issues && typeof octokit.issues.createLabel === "function") {
    return octokit.issues;
  }
  if (octokit.rest && octokit.rest.issues) {
    return octokit.rest.issues;
  }
  throw new Error("octokit has no issues API");
}

/**
 * Create the five locked size labels on the repo if they are missing.
 * Existing labels (including wrong-color ones) are left as-is.
 */
async function ensureSizeLabels(octokit, owner, repo) {
  const issues = issuesApi(octokit);
  for (const { name, color } of SIZE_LABELS) {
    try {
      await issues.createLabel({ owner, repo, name, color });
    } catch (error) {
      if (error.status !== 422) {
        throw error;
      }
    }
  }
}

/**
 * Replace any `size/*` labels on the PR with `label`. Never touches other labels.
 */
async function applySizeLabel(octokit, { owner, repo, issue_number, label }) {
  const issues = issuesApi(octokit);
  await ensureSizeLabels(octokit, owner, repo);

  const { data: current } = await issues.listLabelsOnIssue({
    owner,
    repo,
    issue_number,
  });

  const sizeNames = current
    .filter((entry) => entry.name.startsWith(SIZE_PREFIX))
    .map((entry) => entry.name);

  for (const name of sizeNames) {
    if (name !== label) {
      await issues.removeLabel({ owner, repo, issue_number, name });
    }
  }

  if (!sizeNames.includes(label)) {
    await issues.addLabels({
      owner,
      repo,
      issue_number,
      labels: [label],
    });
  }
}

module.exports = { ensureSizeLabels, applySizeLabel, SIZE_PREFIX };
