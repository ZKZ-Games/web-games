# Production pipeline

Plain path from a local change to a public build.

## 1. Local

You work in `games/<slug>`. The shared kit lives in `packages/kit`. Root scripts fan out to every game.

- pnpm dev — play the playground
- pnpm --filter <slug> dev — play any other title
- pnpm new-game <slug> — start a new folder from the template

No env files. No secrets. Open the Vite URL and play.

## 2. PR

Open a branch, commit the game (or kit) change, open a pull request against main. Keep the PR small: one title, or one kit fix.

## 3. CI

`.github/workflows/ci.yml` runs on every push and PR:

1. Checkout
2. pnpm + Node 22
3. pnpm install (frozen lockfile)
4. lint
5. typecheck
6. build every game

If any step fails, the PR stays red. Fix locally with the same root scripts.

## 4. Pages

`.github/workflows/deploy.yml` runs on main. It builds every game, copies each `dist` into `site/<slug>/`, writes a tiny index, and uploads a GitHub Pages artifact. Turning on Pages in the repo settings is a later step — the workflow is ready, the live site is not required yet.

## Why this shape

One lockfile, one CI, one kit. A new game is a folder, not a new pipeline.

