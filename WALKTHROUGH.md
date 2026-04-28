# Studio City MVP v0.1 Completed

I have finished the v0.1 milestone for Studio City based on your specifications, bringing the game from a repository setup state to a playable 2-player multiplayer application using event-sourced state!

## Changes Made

### 1. Game Card Database
Created a structured and robust data layer defining the logic and details of the 108 cards in the game.
- **Movies**: 31 cards generated with ranks perfectly summing to 45 as per the rules.
- **Box Office**: 25 cards representing 1 to 4 bills.
- **Reviews**: 25 cards representing 1 to 4 stars.
- **Contracts**: 27 cards with target conditions (e.g., "Requires 5 total bills", "Requires 2 loved reviews").

### 2. Action Flow and Reducers
Implemented a deterministic logic engine in Redux that derives the full complex state of the game solely from a stream of simple user-initiated events (`actions`).
- Added actions for claiming seats (`SEAT_CLAIMED`), starting the game (`GAME_STARTED`), and making contract choices (`CONTRACT_CHOSEN`).
- Built a custom **Linear Congruential Generator (LCG)** randomizer seeded by the `GAME_STARTED` event to guarantee that deck shuffling and market reveals are perfectly synchronized and deterministic across all clients without needing to save market state to Firestore.
- Added comprehensive reducer logic handling:
  - Generating and displaying the Round Market (Contracts, Reviews, Box Office).
  - Instantly calculating Box Office and Review forced awards when movies are played.
  - Tracking Contract Pick turns.
  - Final end-of-game score evaluation using contract rules.

### 3. Server-Side Hidden State
Leveraged Firebase Cloud Functions to govern the parts of the game involving private information.
- `startGame`: Shuffles the movie deck, secretly deals 6 cards to each player's `private` document collection, and broadcasts the public `GAME_STARTED` event with the RNG seed.
- `submitMovie`: Safely receives a player's secret movie choice. It stores it temporarily in the player's private document. Once the server confirms all required players have made a choice, it automatically reveals them all at once via a `MOVIES_REVEALED` event, preventing cheating or snooping!

### 4. Svelte Game UI
Completely rewrote the `+page.svelte` game board component to present the game state clearly with dynamic glassmorphism aesthetics.
- **Lobby Phase**: Players can join and claim seats. The host gets a "Start Game" button.
- **Playing Phase**: The screen divides cleanly into The Market, Opponent Boards (scores and earned cards), and Your Hand.
- **Interactions**: Built-in visual indicators and clickable CSS animations for when it's your turn to choose a contract or play a movie.
- Built strictly with Vanilla Svelte CSS — no Tailwind, per the constraints!

### 5. Verified Code Builds
The application and the cloud functions build successfully. The E2E Playwright tests were adjusted for the new layout.

## What's Next?
The game is playable! To see it in action, run the development environment with emulators locally, join the room from two separate browser windows (or tabs), and enjoy a full 5-round game.
