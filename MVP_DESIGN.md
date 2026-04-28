# MVP Design: v0.1

This document describes the v0.1 target for Studio City. It turns the project-level architecture decisions into a concrete first playable milestone while keeping implementation details reviewable before code is written.

## v0.1 Goal

v0.1 should prove that Studio City can run as a multiplayer web game where every visible game state is derived from a replayable stream of user-input actions.

The release should support:

- creating a game room,
- joining a game room by code,
- listening to a room in Firestore,
- replaying room actions through Redux reducers,
- rendering the derived UI in Svelte/SvelteKit,
- preserving hidden information boundaries through Firebase Cloud Functions,
- deploying frontend previews through GitHub Pages,
- validating Firebase rules/functions in CI,
- deploying Firebase rules/functions from `main` once deploy credentials are configured.

## Non-Goals

v0.1 is not trying to be the final game.

Out of scope:

- polished art direction,
- full animation,
- AI opponents,
- tablet-specific support,
- public matchmaking,
- chat,
- persistent accounts beyond what is needed to identify players safely,
- recording computed game outcomes as events.

## Frontend

Use:

- Svelte/SvelteKit,
- TypeScript,
- vanilla Svelte CSS,
- Redux for state management,
- Bun for package management and scripts,
- Nix for reproducible local development.

Do not use Tailwind.

The app should keep the existing E2E discipline:

- Playwright tests,
- zero-pixel visual baselines,
- numbered scenario folders,
- generated scenario README files,
- committed screenshots.

## Backend

Use Firebase:

- Firestore for shared game room data and action history,
- Cloud Functions for trusted server-side logic and hidden/private information,
- Firestore Security Rules for client access boundaries.

The Firebase project is:

```text
studiocity-f56c1
```

## GitHub Secrets

The Firebase web configuration has been added to GitHub Actions secrets.

Script-friendly names:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`
- `FIREBASE_CONFIG_JSON`

Vite-friendly names:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

Still needed before CI can deploy Firebase rules or functions:

- a deploy credential such as `FIREBASE_SERVICE_ACCOUNT` or an equivalent workload identity setup.

The web config values are enough to initialize the frontend SDK. They are not enough to deploy Firestore rules or Cloud Functions.

## Room Model

Game rooms are addressed by a random four-letter code.

Rules:

- codes are all capital letters,
- example: `ABCD`,
- route shape: `/room/ABCD`.

Opening `/room/ABCD` should:

1. validate the room code shape,
2. start a Firestore listener for the room,
3. load the room action history,
4. replay actions through Redux reducers,
5. render the derived game UI,
6. apply new actions as Firestore emits them.

The Firestore path can start as:

```text
game/GAME_CODE
```

The exact schema can evolve, but the human-facing room code should remain stable.

## Event-Sourced Action Policy

The action stream is the canonical game record.

Recorded actions must correspond only to user input.

Recorded actions must never represent computed facts.

Allowed examples:

- player creates room,
- player joins room,
- player claims or names a seat,
- player marks ready,
- player chooses a movie card,
- player chooses a contract when the rules ask for that decision,
- player confirms an explicit choice.

Disallowed examples:

- box office standings,
- awarded box office card IDs,
- review standings,
- awarded review card IDs,
- computed contract order,
- final scores,
- contract completion booleans,
- any other value that reducers can compute deterministically.

Reducers and selectors derive all computed state from:

- static card/rules data,
- room metadata,
- user-input action history.

This keeps replay deterministic and makes the rules implementation auditable.

## Redux Shape

The Redux store should be designed around replay.

Expected slices/modules:

- static rules/card data,
- current room connection state,
- local player/session identity,
- replayed game state,
- derived UI selectors.

The Firestore listener should not directly set computed UI state. It should feed ordered actions into the replay path.

## Hidden Information

Hidden information must not leak through public Firestore documents or client-side computation.

Use Cloud Functions for operations that require trusted hidden state, including:

- dealing private hands,
- storing unrevealed simultaneous movie selections,
- revealing selections only when all required players have submitted,
- validating choices that depend on private state.

The client should only receive the information that the current player is allowed to know.

## v0.1 Gameplay Scope

The first playable version should cover one complete 2-player game before expanding to 3-5 players.

Minimum flow:

1. create room,
2. join room,
3. assign two player seats,
4. start game,
5. deal private movie hands,
6. reveal public round markets,
7. submit simultaneous movie choices privately,
8. reveal chosen movies after both players submit,
9. derive forced box office and review awards,
10. let players choose contracts in derived contract-rank order,
11. persist only user choices as actions,
12. repeat for five rounds,
13. derive final scoring from reducers/selectors.

The MVP can use simplified visual presentation as long as the event model and hidden-information boundaries are correct.

## Firestore Sketch

Initial shape can be:

```text
game/{gameCode}
  metadata
  publicState
  actions/{actionId}
  private/{playerId}
```

Guidance:

- `actions` stores append-only user-input events.
- `metadata` stores non-secret room metadata.
- `publicState` may store public, non-authoritative convenience data only if it can be regenerated.
- `private/{playerId}` stores data visible only to that player.
- Cloud Functions own writes that reveal or transform hidden information.

If a field is computed and can be replayed, prefer not to store it as canonical data.

## Firebase Rules And Functions

Firestore rules should enforce:

- room documents are readable as appropriate,
- private player documents are readable only by the matching player/session,
- clients cannot write computed game results,
- clients cannot write another player's private choices,
- action writes match allowed user-input action shapes.

Cloud Functions should handle:

- room creation when server-side initialization is needed,
- private hand generation,
- simultaneous choice submission if direct client writes would leak data,
- reveal transitions,
- validation of choices against hidden/private state.

## CI And Deployment

Existing CI should continue to:

- build the frontend,
- run Playwright E2E tests,
- deploy GitHub Pages PR previews,
- deploy GitHub Pages production on `main`.

Firebase CI should be added when implementation begins:

- validate Firestore rules on PRs,
- build Cloud Functions on PRs,
- run rules/functions tests on PRs,
- deploy rules/functions on `main`.

Deployment from CI is blocked until a Firebase deploy credential is added to GitHub secrets.

## Config Script Requirement

Add a script that can accept a Firebase config stanza and set repository secrets with `gh secret set`.

It should write:

- the individual `FIREBASE_*` secrets,
- the individual `VITE_FIREBASE_*` secrets,
- `FIREBASE_CONFIG_JSON`.

It should not print secret values after setting them.

The script should separately document the additional deploy credential required for rules/functions deployment.

## Tests For v0.1

Add reducer tests that replay action histories and assert derived state.

Important cases:

- room creation,
- player joins,
- private hand assignment is not represented as a user-input action,
- simultaneous movie choice submission,
- reveal after all required choices exist,
- forced box office/review award derivation,
- contract choice order derivation,
- five-round game end,
- scoring derivation.

Add E2E scenarios for:

- homepage,
- create room,
- join room by code,
- room listener renders state,
- two-player first round happy path.

Add Firebase tests for:

- Firestore rule access to public room data,
- private player data access,
- invalid computed action writes,
- Cloud Function validation of private choices.

## Open Questions For v0.1

- Should v0.1 require Firebase Auth anonymous auth, or can it use a lighter signed session token?
- Should room codes use every `A-Z` letter or avoid ambiguous letters like `I` and `O`?
- Should public convenience projections be stored in Firestore, or should v0.1 rely entirely on replay in the client?
- Which Cloud Function API shape best preserves hidden information for simultaneous movie choices?
- What exact service account or workload identity setup should be used for CI deployment?
