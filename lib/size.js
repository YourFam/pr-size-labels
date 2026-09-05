"use strict";

/** GitHub label colors are hex without `#`. Locked — do not change. */
const SIZE_LABELS = [
  { name: "size/XS", color: "0e8a16", min: 0, max: 9 },
  { name: "size/S", color: "1d76db", min: 10, max: 29 },
  { name: "size/M", color: "fbca04", min: 30, max: 99 },
  { name: "size/L", color: "e99695", min: 100, max: 499 },
  { name: "size/XL", color: "b60205", min: 500, max: Infinity },
];

/**
 * Map GitHub's webhook `additions` + `deletions` to one size label.
 * Returns `{ name, color }` or `null` when counts are missing (skip the delivery).
 */
function sizeFromCounts(additions, deletions) {
  if (additions === null || deletions === null) {
    return null;
  }
  if (typeof additions !== "number" || typeof deletions !== "number") {
    return null;
  }
  if (!Number.isFinite(additions) || !Number.isFinite(deletions)) {
    return null;
  }

  const churn = additions + deletions;
  for (const bucket of SIZE_LABELS) {
    if (churn >= bucket.min && churn <= bucket.max) {
      return { name: bucket.name, color: bucket.color };
    }
  }
  return null;
}

module.exports = { SIZE_LABELS, sizeFromCounts };
