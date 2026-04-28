# Finish Studio City MVP v0.1

This plan details the technical steps to complete the v0.1 goal outlined in `MVP_DESIGN.md`: creating a playable 2-player multiplayer game where state is derived from user actions, with hidden information handled by Cloud Functions.

## User Review Required

> [!IMPORTANT]
> The game logic is complex and relies on a "triple auction". Implementing it requires careful management of game state within Redux and maintaining hidden information via Cloud Functions. Please review the proposed Redux state shape and action flow to ensure it aligns with the vision.

## Open Questions

> [!WARNING]
> - For v0.1, we're targeting a 2-player game. Should we hardcode the game to start automatically when 2 players join, or should there be an explicit "Start Game" button?
> - The cards have specific values and conditions. Since the full card manifest isn't in the README, I will need to generate a representative subset or proxy of the 108 cards (Movies, Box Office, Reviews, Contracts) to make the game playable, or ask you for the specific card data if it is available elsewhere. How should we handle the card database for this MVP?

## Proposed Changes

### Card Data and Types

We will create a structured definition of all cards to be used by reducers and UI.

#### [NEW] src/lib/game/cards.ts
Define TypeScript interfaces for `MovieCard`, `BoxOfficeCard`, `ReviewCard`, and `ContractCard`. Since we do not have the complete 108 card database, we will define a minimum viable set (or generate placeholders that follow the rules: e.g., Movie ranks sum to 45) to test the 2-player game mechanics.

### Action Policy & Reducers

We will extend the Redux state to handle the full game lifecycle.

#### [MODIFY] src/lib/game/actions.ts
Add new user-input actions:
- `SEAT_CLAIMED`: Player claims one of the 2-5 seats.
- `GAME_STARTED`: The host (or first player) starts the game.
- `MOVIE_PLAYED`: A player selects a movie (this action will be injected by the Cloud Function once all players submit).
- `CONTRACT_CHOSEN`: A player selects an available contract during their turn in the contract auction.

#### [MODIFY] src/lib/game/reducer.ts
Implement the complex game state derivation:
- Track current round (1-5), current phase (selection, box_office_award, review_award, contract_auction).
- Compute revealed market cards (Box Office, Reviews, Contracts) for the round deterministically based on a random seed generated at `GAME_STARTED`, or drawn via server action.
- Compute the forced awards for Box Office and Reviews once movies are revealed.
- Track the turn order for the contract auction based on contract ranks of played movies.
- Derive final score computation.

### Backend (Cloud Functions)

Hidden information must be protected.

#### [MODIFY] functions/src/index.ts
Add two new Firebase Functions:
- `startGame`: Handles generating the shuffled decks, dealing 6 private movie cards to each player's `private/{playerId}` document, and writing the `GAME_STARTED` public action.
- `submitMovie`: Receives a player's secret movie choice and stores it in their private document. Once all required players have submitted, it aggregates the choices and writes a single public `MOVIES_REVEALED` (or `MOVIE_PLAYED` for each player) action to the public stream.

#### [MODIFY] firestore.rules
Ensure clients can read their own `private/{playerId}` document but not others, and that they cannot spoof game actions.

### Frontend UI

#### [MODIFY] src/routes/room/[code]/+page.svelte
Build the game board:
- **Lobby State**: Show joined players and a "Claim Seat" / "Start Game" button.
- **Round State**: Display the central market (available Box Office, Review, and Contract cards for the round).
- **Player Hand**: Read from the private Firestore document (using a separate listener for `private/${playerId}`) to display the 6 movie cards.
- **Interactions**:
  - Click a movie to submit it (shows a "Waiting for others..." state).
  - Show the reveal animation or state when all have submitted.
  - Show the forced distribution of Box Office and Review cards.
  - If it is the player's turn to choose a contract, make the available contracts clickable.
- **End Game**: Display final scores.

## Verification Plan

### Automated Tests
- **Redux Unit Tests**: Add `reducer.test.ts` to simulate a full 5-round, 2-player game by dispatching a sequence of actions and asserting the correct derivation of scores and awards.
- **E2E Scenarios**: Update `tests/e2e/002-room-listener` to cover a complete 2-player game flow using Playwright and the Firebase Emulators.

### Manual Verification
- Deploy to GitHub Pages (PR preview) and manually play through a 2-player game in two separate browser windows to verify hidden information and synchronicity.
