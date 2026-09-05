# Privacy policy — PR Size Labels

**Last updated:** 2026-09-05

PR Size Labels is a free GitHub App. It labels pull requests from numbers GitHub already computed. It does not clone repositories and it does not read file contents.

## What we receive

GitHub sends webhook deliveries to our server when:

- a pull request is opened, synchronized (new commits), or reopened
- Marketplace plan events fire (purchase, cancel, and related), which GitHub requires for App listings

Each pull-request delivery includes the repository name, the pull request number, and GitHub’s `additions` and `deletions` counts. We use those two numbers only.

## What we do not collect

- We do not clone your repository.
- We do not fetch the git tree or diffs.
- We do not read file contents.
- We do not store customer source code.
- We do not log diffs, patches, or file paths from your project.

## What we keep

We keep only what is required to run the App:

- GitHub App credentials on the host (`APP_ID`, `PRIVATE_KEY`, `WEBHOOK_SECRET`), not in git
- transient webhook payloads in memory while a delivery is handled
- host/platform logs (timestamps, HTTP status, delivery id) for operating the service

Labels we create (`size/XS` through `size/XL`) live on **your** GitHub repository. We do not keep a parallel database of labels.

## Third parties

- **GitHub** is the source of webhook payloads and the destination of label API calls.
- **Render** (or the current host) runs the process and stores environment secrets.

## Uninstall

Uninstalling the App from a GitHub organization or repository stops new webhook deliveries for that install. Existing `size/*` labels on pull requests remain until you remove them.

## Contact

Questions or deletion requests: open an issue on [YourFam/pr-size-labels](https://github.com/YourFam/pr-size-labels/issues).
