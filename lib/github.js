"use strict";

/**
 * App JWT → installation access token → Octokit.
 * Used when we need an installation client outside a Probot context.
 */
async function octokitForInstallation({ appId, privateKey, installationId }) {
  const [{ Octokit }, { createAppAuth }, { restEndpointMethods }] =
    await Promise.all([
      import("@octokit/core"),
      import("@octokit/auth-app"),
      import("@octokit/plugin-rest-endpoint-methods"),
    ]);

  const AppOctokit = Octokit.plugin(restEndpointMethods);
  return new AppOctokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
      installationId,
    },
  });
}

module.exports = { octokitForInstallation };
