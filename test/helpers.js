"use strict";

const crypto = require("crypto");

function generatePrivateKey() {
  const { privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs1", format: "pem" },
    publicKeyEncoding: { type: "pkcs1", format: "pem" },
  });
  return privateKey;
}

function signBody(secret, body) {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  return (
    "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex")
  );
}

function prPayload({
  action = "opened",
  additions = 30,
  deletions = 10,
  number = 1,
  owner = "YourFam",
  repo = "demo",
} = {}) {
  return {
    action,
    installation: { id: 2 },
    number,
    pull_request: {
      number,
      additions,
      deletions,
    },
    repository: {
      name: repo,
      owner: { login: owner },
    },
    sender: { login: "tester" },
  };
}

module.exports = { generatePrivateKey, signBody, prPayload };
