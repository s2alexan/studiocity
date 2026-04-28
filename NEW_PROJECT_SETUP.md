# New Project Setup

This document summarizes the reusable setup process learned while creating Studio City. Use it as the starting checklist for future public PWA/game repositories.

## Default Project Shape

- Create the project folder in the requested location before installing or scaffolding anything.
- Start `PROJECT_LOG.md` immediately.
- Record every user prompt verbatim in the log.
- Keep setup notes and lessons learned in the same log so later sessions can turn them into reusable skills.
- Add `AGENTS.md` early with the repository workflow conventions.
- Use pull requests for repository changes by default.
- Use short-lived `codex/` branches for Codex-authored work.

## Reproducible Tooling

- Use a Nix flake for the development environment.
- Put `bun`, `gh`, and `git` in the default dev shell.
- Use Bun for `package.json`, dependency installation, scripts, and `node_modules`.
- Run project commands through `nix develop` so tool versions remain reproducible.
- Commit both `flake.nix` and `flake.lock`.
- Commit `bun.lock` after dependency installation.

Initial verified versions for Studio City were:

- Nix: Determinate Nix 3.18.1 / Nix 2.33.4
- Bun: 1.3.3
- GitHub CLI: gh 2.83.2 from nixpkgs
- Git: 2.51.2

## macOS Setup Notes

- Hidden Codex tool sessions cannot show `sudo` password prompts to the user.
- For password-requiring setup, create a visible `.command` file and open it in Terminal.
- GitHub CLI browser authentication may also need to run in a visible Terminal window if interactive prompts do not render cleanly in Codex.
- New Codex shell sessions may need:

```sh
source /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh
```

## GitHub Repository Setup

- Create the GitHub repository with `gh`.
- Make the repository public when GitHub Pages is required.
- Public Pages hosting for Studio City uses:

```text
https://s2alexan.github.io/studiocity/
```

- Enable GitHub Pages from the `gh-pages` branch root.
- If the Pages REST API rejects form-encoded nested input, send JSON:

```sh
printf '%s' '{"source":{"branch":"gh-pages","path":"/"}}' \
  | gh api repos/OWNER/REPO/pages -X POST --input -
```

- Verify Pages configuration with:

```sh
gh api repos/OWNER/REPO/pages
```

## Documentation Baseline

Every new project should start with:

- `README.md`: concise project summary, current rules/product behavior, development commands, copyright.
- `VISION.md`: product goals, experience principles, technical direction, near-term milestones, open questions.
- `PROJECT_LOG.md`: verbatim prompts, setup notes, lessons learned.
- `AGENTS.md`: collaboration workflow and project conventions.
- `E2E_GUIDE.md`: testing philosophy and scenario conventions once UI work begins.

Studio City uses this copyright statement:

```text
Copyright (c) 2026 Stefan Alexander. All rights reserved.
```

## PWA Scaffold

- Use Vite with TypeScript for the initial web scaffold.
- Keep the first screen minimal until the product direction is ready.
- Include a web app manifest from the start.
- Configure the Vite base path from `PUBLIC_BASE_PATH` so GitHub Pages works for both production and PR previews.
- For Studio City, production builds deploy under `/studiocity/` and PR previews under `/studiocity/prN/`.

## E2E Testing Strategy

Model E2E testing after `anicolao/food` and `anicolao/chess-tt`.

Key process decisions:

- Use Playwright.
- Treat E2E tests as the primary correctness signal for visible UI behavior.
- Use a zero-pixel tolerance for visual snapshots.
- Keep tests deterministic.
- Avoid arbitrary sleeps such as `page.waitForTimeout()`.
- Keep Playwright assertions and actions at or under 2000ms, except for CI web server startup.
- Prefer role, label, and text locators over brittle CSS selectors.
- Commit scenario README files and screenshot baselines.

Use numbered scenario folders:

```text
tests/e2e/
├── helpers/
│   └── test-step-helper.ts
└── 001-homepage/
    ├── 001-homepage.spec.ts
    ├── README.md
    └── screenshots/
        └── 000-initial-load.png
```

Use a unified step helper so each test step runs assertions, waits for animations, captures a screenshot, and updates scenario documentation in one place.

## CI And Visual Baselines

- Visual baselines are OS-sensitive because fonts and rendering differ across runners.
- If screenshots are generated on macOS, run E2E CI on `macos-latest`.
- Alternatively, commit per-platform snapshots deliberately.
- Upload Playwright reports on failure or completion for easier debugging.
- Use `gh run view --log-failed` and `gh pr checks` to investigate CI failures.

## GitHub Pages Workflows

Replicate the reference workflow pattern:

- On pull requests, build and deploy to `gh-pages` under `prN/`.
- On pushes to `main`, build and deploy to the root of the `gh-pages` branch.
- Keep previous deployments with `keep_files: true`.
- Add or update a PR comment with the preview URL.

For Studio City:

- PR preview URL format: `https://s2alexan.github.io/studiocity/prN/`
- Production URL format: `https://s2alexan.github.io/studiocity/`

Production may 404 before the first successful `main` deploy, even if PR previews work.

## Verification Checklist

Before opening a setup PR:

- `nix develop` enters cleanly and prints expected tool versions.
- `bun install` creates or updates `bun.lock`.
- `bun run build` passes.
- `bun run test:e2e:update-snapshots` generates expected scenario docs and screenshots.
- `bun run test:e2e` passes without updating snapshots.
- `git diff --check` passes.
- `gh pr create` opens a PR against `main`.
- `gh pr checks --watch` reports green checks.
- PR preview URL returns HTTP 200.
- GitHub Pages settings point at `gh-pages` branch root.

## Known Pitfalls

- macOS may route plain `git` to Apple developer tools prompts. Use the Nix-provided `git` inside `nix develop`.
- Vite/Rollup native packages may hit macOS code-signature issues under Node in the Nix shell. Running scripts through Bun's runtime avoided that in Studio City:

```json
{
  "build": "bun --bun tsc && bun --bun vite build",
  "test:e2e": "bun --bun playwright test"
}
```

- GitHub Pages cannot be enabled for a private repository if the account plan does not support it.
- PR previews can work before production if the PR workflow has deployed `prN/` but `main` has not yet deployed root.
