# Studio City Vision

Studio City should become a fast, legible, and replayable PWA adaptation of the tabletop game. The digital version should preserve the tension of simultaneous movie selection and the clarity of the triple auction, while making scoring, contract eligibility, and round state effortless to understand.

## Product Goals

- Teach the game through play, with minimal interruption.
- Make every round's three contests easy to scan: box office, reviews, then contracts.
- Keep contract conditions visible and explain why each contract is complete or incomplete.
- Support 2-5 players cleanly.
- Work as an installable PWA on desktop and mobile.
- Keep the rules and card data versioned so future balance iterations can be tested and reproduced.

## Experience Principles

### Tension First

The core moment is choosing one movie without knowing what rival studios will release. The interface should protect that moment with a clear simultaneous selection flow and a satisfying reveal.

### Three Auctions, One Story

Each round should feel like a movie release weekend:

- Box office decides immediate money.
- Reviews shape prestige and future contract potential.
- Contracts reward strategic positioning and long-term planning.

The UI should show these as connected beats, not disconnected bookkeeping.

### Contracts Should Be Transparent

Contracts are the deepest scoring system. The app should show their requirements, live progress, and final scoring status without forcing players to manually audit totals.

### Physical Rules Remain Canon

The PWA should implement the latest tabletop rules faithfully. Digital conveniences should clarify, automate, and speed up play without changing strategic incentives unless a future rules version explicitly does so.

## Technical Direction

- TypeScript-first implementation.
- Bun for package management and scripts.
- Nix flake for reproducible local development.
- Card definitions as structured data, suitable for tests and future simulation.
- PWA support from the start: responsive layout, offline-capable shell, manifest, and service worker.

## Near-Term Milestones

1. Create the TypeScript PWA scaffold.
2. Encode movie, box office, review, and contract card data.
3. Implement deterministic game state and round resolution.
4. Add local pass-and-play interaction for 2-5 players.
5. Add contract evaluation and end-game scoring.
6. Add tests for round awards, contract persistence, and scoring.

## Open Design Questions

- Should the first playable version use pass-and-play only, or include local AI opponents?
- Should simultaneous selection use a shared-device privacy flow, separate device multiplayer later, or both?
- How much card art and theme should be present in the first PWA milestone?
- Should simulations live in the app repository as developer tools for future balance work?
