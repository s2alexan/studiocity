# MVP Design

This document records Studio City-specific product and architecture decisions for the first playable web MVP. These decisions are intentionally project-specific and may differ from the reusable setup process in `NEW_PROJECT_SETUP.md`.

## Product Target

Studio City will be a public, installable web game for 2-5 players. The MVP should prioritize a faithful multiplayer implementation of the tabletop rules, clear game-room joining, and deterministic replay of game state from user actions.

The first implementation should be built to support:

- creating or joining a room by code,
- replaying game history from stored actions,
- rendering the current game state from reducers,
- handling hidden or private information without leaking it to other clients,
- deploying continuously through the existing PR preview and GitHub Pages workflow.

## Frontend Stack

- Use Svelte/SvelteKit for the UI.
- Use vanilla Svelte CSS.
- Do not use Tailwind.
- Use TypeScript throughout.
- Keep the app compatible with the existing Bun and Nix development workflow.
- Continue using Playwright E2E tests and committed visual scenario artifacts for visible UI behavior.

## Backend Stack

- Use Firebase as the backend platform.
- Use Firestore for shared game-room state and action history.
- Use Firebase Cloud Functions for trusted server-side work, especially hidden or private information.
- Deploy Firebase rules and functions from CI.

## Game Rooms

Game rooms should be addressable by short public codes.

- Room codes are random 4-letter strings.
- Room codes use all capital letters, for example `ABCD`.
- The route shape should be:

```text
/room/ABCD
```

Opening `/room/ABCD` should start a Firestore listener for that game room and replay its actions to render the UI.

The Firestore collection/path can be named something like:

```text
game/GAME_CODE
```

The exact schema can evolve, but the room code should remain the human-facing join key.

## State Management

Use Redux for client-side state management.

Studio City should use Redux actions as the event-sourced record of play. The stored action history is the canonical source of truth for the game room.

Reducers should derive all UI state from the action stream.

This means:

- actions represent user input,
- reducers compute current game state,
- selectors compute UI projections,
- Firestore listeners hydrate and update local Redux state by replaying actions.

## Event-Sourcing Policy

Recorded game actions must correspond only to user input.

Recorded game actions must never represent computed results.

Examples of user-input actions:

- a player creates a room,
- a player joins a room,
- a player chooses a movie card,
- a player chooses a contract when eligible,
- a player confirms a required decision.

Examples of things that should not be recorded as actions:

- sorted box office standings,
- computed card assignments,
- contract completion status,
- final scores,
- derived current player order,
- any value that reducers can recompute from earlier user input and deterministic game data.

This policy keeps replay deterministic and prevents the action log from drifting away from the rules implementation.

## Hidden And Private Information

Hidden or private information must not be computed in a way that leaks through the public client.

Use Firebase Cloud Functions for trusted computation when information should be hidden from some players. Examples may include:

- private hands,
- secret simultaneous selections before reveal,
- any server-authoritative validation that depends on hidden data.

The client should receive only the information that player is allowed to know.

## Firestore Listening Model

When a user opens a room route:

1. Validate the room code shape.
2. Start a Firestore listener for that room.
3. Load the room action history.
4. Replay actions through reducers.
5. Render the current game UI from derived state.
6. Continue applying new actions from the listener.

Reducers should be deterministic, pure, and testable.

## Firebase Configuration And Secrets

The project needs a script that takes the Firebase configuration stanza and turns it into GitHub repository secrets.

The script should support configuring CI without manually copying values one by one. It should be able to set the repository secrets needed for:

- Firebase web app configuration,
- Firebase project identification,
- Firebase deploy authentication,
- any Cloud Functions or rules deployment inputs.

Exact secret names should be chosen when Firebase is added, but the workflow should be documented and repeatable.

## CI And Deployment

The existing GitHub Pages deploy workflow should continue to host the static frontend.

Firebase CI should additionally be able to:

- validate Firestore rules,
- deploy Firestore rules,
- build Cloud Functions,
- test Cloud Functions where practical,
- deploy Cloud Functions.

Firebase deployment should happen through GitHub Actions using repository secrets, not local-only credentials.

PRs should continue to use preview deployments for the frontend. Firebase rules/functions deployment policy for PRs should be decided carefully before implementation; the default assumption is:

- PRs run validation and tests,
- merges to `main` deploy production Firebase rules and functions.

## Testing Strategy

Continue the existing E2E strategy for UI behavior:

- Playwright,
- zero-pixel visual baselines,
- numbered scenario folders,
- unified `TestStepHelper`,
- generated scenario README files,
- committed screenshots.

Add focused reducer tests for the event-sourced game model. These should verify that replaying user-input actions produces the correct derived game state without recording computed actions.

Add Firebase rules and Cloud Functions tests before relying on hidden-information behavior.

## Open Questions

- What exact Firestore document and subcollection layout should represent rooms and action streams?
- How should player identity be represented for the MVP: anonymous session, named seat, Firebase Auth, or another lightweight identity?
- Which actions require Cloud Function validation before being written?
- How should simultaneous movie choices be represented so unrevealed choices stay private?
- Should room codes avoid ambiguous letters such as `I` and `O`, or use the full `A-Z` range?
- What is the first minimal Firebase secret set needed for CI?
