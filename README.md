# PR Size Labels

**Tagline:** Labels pull requests size/XS–size/XL from GitHub's own line counts.

A free GitHub App (`pr-size-labels[bot]`) that puts a coarse size pill on every pull request so you can scan the list without opening each one. It reads `additions` and `deletions` from the webhook payload. It does not clone your repo and it does not store or log source.

## Install (2 clicks)

1. Open the [PR Size Labels GitHub App](https://github.com/apps/pr-size-labels) (Marketplace listing once approved).
2. Click **Install**, pick the organization, and choose all repositories or only selected ones.
3. Open a pull request. The bot adds exactly one of `size/XS` … `size/XL`.

No workflow YAML. No Action to pin.

## Locked size rule

`churn = additions + deletions` from the GitHub webhook. One label. If the PR already has a `size/*` label, it is **replaced**, never stacked.

| Label | `additions + deletions` | Color |
|---|---|---|
| `size/XS` | 0–9 | `#0e8a16` |
| `size/S` | 10–29 | `#1d76db` |
| `size/M` | 30–99 | `#fbca04` |
| `size/L` | 100–499 | `#e99695` |
| `size/XL` | 500+ | `#b60205` |

The App creates these five labels on the repository if they are missing. It never deletes or changes labels that are not `size/*`.

Runs only on `pull_request` **opened**, **synchronize**, and **reopened**. Description-only edits (`edited`) are ignored. If GitHub sends `additions` or `deletions` as `null` (counts still calculating), that delivery is skipped.

## Permissions

- **Pull requests:** write (apply and replace `size/*` labels)
- **Metadata:** read

## Screenshots

_Add listing screenshots here (HUMAN 3 — Marketplace listing)._

| Slot | Capture |
|---|---|
| 1. PR list pill | Pull requests list showing a `size/*` pill next to a title |
| 2. Sidebar labels | Open PR, right sidebar **Labels** |
| 3. Bot timeline | `pr-size-labels[bot] added the size/L label` (and removed the previous size if it grew) |

Place files under `docs/screenshots/` when you take them. Do not block shipping on screenshots.

## Privacy and support

- Privacy: [PRIVACY.md](./PRIVACY.md)
- Support: [GitHub Issues](https://github.com/YourFam/pr-size-labels/issues)

## Run it yourself

This repo is the App server. Host it on an always-on Node process (Render blueprint: `render.yaml`).

Environment (see `.env.example`; never commit real values):

| Variable | Meaning |
|---|---|
| `APP_ID` | GitHub App id |
| `PRIVATE_KEY` | App private key (PEM) |
| `WEBHOOK_SECRET` | Shared secret for `X-Hub-Signature-256` |

```bash
npm ci
npm test
npm start
```

Webhook URL is the service origin (`POST /`). GitHub App webhook deliveries must use that URL and the same `WEBHOOK_SECRET`.

```
npm start
```

Listens on `HOST` (default `0.0.0.0`) and `PORT` (default `3000`, or whatever the host injects).
