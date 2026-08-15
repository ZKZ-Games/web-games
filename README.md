# Web Games

A tiny studio kit for one-screen canvas games.


Orbit is the first game: hold, aim, release, land on pads.


## Setup

Node 22+ and pnpm 9+. From the repo root, pnpm install.

## Play

pnpm dev launches Orbit (the playground). Hold to charge, aim with the pointer, release to launch. Land softly on the pale pads.

Same thing: pnpm --filter playground dev

## New title

pnpm new-game my-title

Copies games/_template to games/my-title and rewrites the name. Then pnpm --filter my-title dev


## Kit

@web-games/kit is the shared library:

- createCanvas — full-window canvas, retina-aware
- createInput — keyboard + pointer, with pressed/released edges
- createLoop — rAF loop with a capped dt in seconds
- math: clamp, lerp, rand, dist, length, normalize

Draw with canvas. No asset pipeline yet.

## Commands

- pnpm dev — playground
- pnpm build — every game
- pnpm lint — ESLint
- pnpm typecheck — TypeScript, no emit
- pnpm new-game slug — scaffold
- pnpm test — scaffold helper tests

## CI

Pushes and PRs run lint, typecheck, and build on Node 22. Merges to main also build a Pages artifact (an index of every game dist). See docs/PIPELINE.md.

