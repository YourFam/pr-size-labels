"use strict";

const { sizeFromCounts, SIZE_LABELS } = require("../lib/size");

function expectBucket(additions, deletions, name) {
  const result = sizeFromCounts(additions, deletions);
  expect(result).not.toBeNull();
  expect(result.name).toBe(name);
  const locked = SIZE_LABELS.find((bucket) => bucket.name === name);
  expect(result.color).toBe(locked.color);
}

describe("sizeFromCounts", () => {
  test("0 churn maps to size/XS", () => {
    expectBucket(0, 0, "size/XS");
  });

  test("boundary 9 → size/XS", () => {
    expectBucket(9, 0, "size/XS");
    expectBucket(4, 5, "size/XS");
  });

  test("boundary 10 → size/S", () => {
    expectBucket(10, 0, "size/S");
    expectBucket(5, 5, "size/S");
  });

  test("boundary 29 → size/S", () => {
    expectBucket(29, 0, "size/S");
    expectBucket(20, 9, "size/S");
  });

  test("boundary 30 → size/M", () => {
    expectBucket(30, 0, "size/M");
    expectBucket(20, 10, "size/M");
  });

  test("boundary 99 → size/M", () => {
    expectBucket(99, 0, "size/M");
    expectBucket(50, 49, "size/M");
  });

  test("boundary 100 → size/L", () => {
    expectBucket(100, 0, "size/L");
    expectBucket(60, 40, "size/L");
  });

  test("boundary 499 → size/L", () => {
    expectBucket(499, 0, "size/L");
    expectBucket(250, 249, "size/L");
  });

  test("boundary 500 → size/XL", () => {
    expectBucket(500, 0, "size/XL");
    expectBucket(250, 250, "size/XL");
  });

  test("large churn stays size/XL", () => {
    expectBucket(10000, 1, "size/XL");
  });

  test("null additions → null (skip)", () => {
    expect(sizeFromCounts(null, 10)).toBeNull();
  });

  test("null deletions → null (skip)", () => {
    expect(sizeFromCounts(10, null)).toBeNull();
  });

  test("both null → null (skip)", () => {
    expect(sizeFromCounts(null, null)).toBeNull();
  });

  test("locked colors match the spec hex (no #)", () => {
    expect(SIZE_LABELS.map((b) => [b.name, b.color])).toEqual([
      ["size/XS", "0e8a16"],
      ["size/S", "1d76db"],
      ["size/M", "fbca04"],
      ["size/L", "e99695"],
      ["size/XL", "b60205"],
    ]);
  });
});
