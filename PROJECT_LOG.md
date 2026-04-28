# Studio City Project Log

## 2026-04-28

### Verbatim Prompt

> we are going to build a PWA for a game named "Studio City" and we need a development environent installed via a nix flake for reproducibility and we are going to use bun to manage package.json / node_modules, and implement in typescript. Nix and bun aren't yet installed, nor is gh or other tools we'll need to interact with github, and there is no project folder yet either. Let's get nix installed, use it to install bun and gh, and make a project folder, and run nix develop to check the versions of these tools, and pause there for us to verify that it all looks good. Later, we are going to want a transcript of all prompts that we used today verbatim, so maybe also start a PROJECT_LOG.md in the project folder with the verbatim prompts, any lessons learned, and so on, so that we might be able to distill out skills or knowledge for next time to make the process faster. Let's put the "Studio City" folder in my desktop folder.

### Verbatim Prompt

> We are writing a game called studio city, here are the rules.
>
> Studio City (triple auction) v10
> 2-5 players
>
> You work for a big movie studio with seven great movies to release, and your job is to choose the order to release them. Other players are rival movie studios with their own seven movies to release. Each round, players secretly choose one of their movies, then reveal them all together. Depending on how your movie compares to the others, you’ll take money from the box office, reviews, and lucrative streaming contracts.
>
> At the end of 5 rounds, the player with the most money wins.
>
> Changes in v10
> 	•	Balanced contracts using Monte Carlo simulation, to make bill-adjusted EV higher for higher-valued contracts.
> Changes in v8
> 	•	Two extra contract cards. You turn over an extra contract (so 1 more than number of players) and don’t discard it between rounds
> About the Cards
>
> 108 cards
>
> 	•	31 Movie cards. Each has a rank from 1-40 in 3 categories; box office (green), reviews (yellow), and contracts (blue). Ranks always add to 45.
> 	•	25 Box Office cards (green) - with 1-4 bills. 3’s and 4’s are blockbusters.
> 	•	25 Review cards (yellow) - with 1-4 stars. 3’s and 4’s are loved.
> 	•	27 Contract cards (blue) - values 3-9.
> 	⁃	Score only if you meet the condition.
> 	⁃	Require specific numbers of total bills, total stars, blockbuster icons, loved icons, and sometimes comparisons with your right neighbour.
> 	⁃	Higher cards are generally better.
>
> Setup
>
> Shuffle the 41 movie cards and deal 6 to each player. This is their hand. Put remaining movie cards back in the box, out of the game.
>
> Make 3 decks (box office cards, review cards, and contract cards), shuffle each, put face-down in the middle.
> Gameplay
>
> The game is played over 5 rounds. 
>
> At the beginning of every round:
> 	•	From the box office deck, turn over cards equal to the number of players, arranging them from lowest to highest
> 	•	From the review deck, turn over cards equal to the number of players, arranging them from lowest to highest
> 	•	From the contract deck, turn over cards so that there are 1 more than the number of players. No need to arrange them.
>
> At the same time, players choose a movie card from their hand, and place it face-down on the table. Once all players have chosen, reveal everyone’s card.
>
> First, players take box office cards
> 	•	The player whose movie card has the highest box office (green) rank must take the highest box office card. The second-highest movie must take the second-highest box office card, etc. The cards must be given out in the specified order - a player can’t choose a different card.
>
> Next, players take review cards in the same way, based on the movie’s review (yellow) rank.
>
> Finally, compare the contract (blue) ranks. This time, the player with the highest contract rank chooses a blue card, then the player with the next-highest contract rank chooses, etc. As there are always 1 more contracts than players, there will be 1 contract left over. Don’t discard it, it will stay for the next round.
>
> After all players have taken cards, discard the used movie cards face-down in a pile in the middle of the table. Your box office, review, and contract cards go face-up in front of you.
>  
> Game end and scoring
>
> Play 5 rounds - your last movie will be unreleased, put it face-up in front of you.
>
> Completed contracts score their value, incomplete contracts score nothing.
> Box office cards are worth their value.
> Review cards aren’t worth anything on their own, they are only for meeting conditions on contracts.
>
> The player with the most points wins.
>
>
> ---- end of rules ----
>
> Write a readme and a vision for this project summarizing the latest rules, and make a github repo called studiocity to contain these

### Verbatim Prompt

> A few updates:
> - movie cards have ranks 0-30
> - do not support tablet
> - remove version notes from readme
>
> In general we want to do everything via PRs, make a note of that in agents.md and put up a PR

### Verbatim Prompt

> We want to use an e2e testing strategy modeled as closely as possible after github.com:anicolao/food and anicolao/chess-tt. Review those two repositories (clone the and read E2E_GUIDE and the test step helper) and make a PR to introduce this process into our repository. Scaffold our site at the same tie with just a blank homepage saying "welcome to studio city". Also, those projects have nice workflows for deploying PR previews and deploying when we merge to main, using gh pages for hosting -- replicate that too.

### Verbatim Prompt

> The gh pages deploy 404s - did you need to set up some settings with gh? The CI is failing too, use gh to investigate and fix.

### Verbatim Prompt

> We need to make this repo public, we forgot to say so earlier. Just put a clear copyright statement all rights reserved, Stefan Alexander.

### Verbatim Prompt

> OK we've reached a point where we'd always like to follow this process for setting up a new repository. Let's review everything in the project log, and write me a summary called NEW_PROJECT_SETUP.md that summarizes every important decision and learning so far, and put that up as a PR for review.

### Verbatim Prompt

> wait a moment - I will merge that PR so you can work off off main. I have merged it now; so pull main and work from there

### Verbatim Prompt

> that looks great, let's merge that PR. Now we're going to ake some policy decisions for studio city that might be different for other projects. We will use firestore for the backend, we will use redux for state management and we will use redux actions to create an event-sourced system where what is recorded in the game actions alwyas corresponds *only to user input* and *never to a computed thing*, and then build reducers that show the UI for the game. We can have a collection naed soething like game/GAME_CODE where GAME_CODE is a random 4-letter string of all capital letters. Then wehn the user opens the game on room/ABCD that will start a firestore listener on that game room and replay the actions to show the UI. The UI itself will be built in svelte/sveltekit with vanilla svelte CSS (NO TAILWIND) and hidden information/private information can be coputed with cloud functions on the firebase project. We'll need a script that can take the firebase configuratoin stanza and turn it into secrets on the repo, and yoiu'll need to be able to deploy firebase rules and functions from CI. Let's start by writing an MVP_DESIGN doc that reflects all tehse decisions accurately, don't write any code yet.

### Verbatim Prompt

> OK that looks good. Please commit and merge that PR and then write an MVP_DESIGN.md laying out a v0.1 of this project. HEre is the setup info for firebase, set up the secrets in gh so that you can deploy what you need for the MVP. // Import the functions you need from the SDKs you need
> import { initializeApp } from "firebase/app";
> import { getAnalytics } from "firebase/analytics";
> // TODO: Add SDKs for Firebase products that you want to use
> // https://firebase.google.com/docs/web/setup#available-libraries
>
> // Your web app's Firebase configuration
> // For Firebase JS SDK v7.20.0 and later, measurementId is optional
> const firebaseConfig = {
>   apiKey: "AIzaSyAWLLfnpfStFLOvTrhLH89Z_jHhBNIj0ck",
>   authDomain: "studiocity-f56c1.firebaseapp.com",
>   projectId: "studiocity-f56c1",
>   storageBucket: "studiocity-f56c1.firebasestorage.app",
>   messagingSenderId: "541528776492",
>   appId: "1:541528776492:web:e262f9c0f44c4b2d0e1689",
>   measurementId: "G-8Q2XTSLR0S"
> };
>
> // Initialize Firebase
> const app = initializeApp(firebaseConfig);
> const analytics = getAnalytics(app);

### Verbatim Prompt

> we just put a studio-city-service-account.json file in ~/Downloads that you can put in github secrets, and we merged the PR for the MVP design. Implement it, being sure that the e2e tests work against firebase emulators

### Setup Notes

- Goal: create a reproducible TypeScript PWA game project using a Nix flake for the development environment.
- Package manager/runtime target: Bun.
- GitHub tooling target: GitHub CLI (`gh`).
- Project location: `/Users/stefanalexander/Desktop/Studio City`.
- Initial machine check found no `nix`, `bun`, or `gh` on `PATH`.
- Added `flake.nix` with a default dev shell containing `bun`, `gh`, and `git`.
- Installed Nix with the Determinate Systems installer.
- First `nix develop` created `flake.lock`.
- Verified development shell versions:
  - Nix: Determinate Nix 3.18.1 / Nix 2.33.4
  - Bun: 1.3.3
  - GitHub CLI: gh 2.83.2 from nixpkgs
  - Git: 2.51.2
- Added `README.md` summarizing Studio City triple auction v10 rules.
- Added `VISION.md` describing the PWA product direction and near-term milestones.
- Created private GitHub repository: `https://github.com/s2alexan/studiocity`.
- Pushed the initial `main` branch to GitHub.
- Updated docs to use movie ranks 0-30.
- Removed tablet support from the product vision.
- Removed version notes from `README.md`.
- Added `AGENTS.md` with a PR-first workflow note.
- Cloned and reviewed `anicolao/food` and `anicolao/chess-tt`, focusing on `E2E_GUIDE.md`, `tests/e2e/helpers/test-step-helper.ts`, Playwright config, and GitHub Pages workflows.
- Scaffolded a Vite TypeScript PWA shell with a blank homepage saying "welcome to studio city".
- Added a Playwright E2E strategy with a unified step helper, generated scenario docs, and committed screenshot baselines.
- Added GitHub Actions for CI E2E testing, PR preview deploys, and main deploys to GitHub Pages.
- Investigated CI and Pages with `gh`.
- Found CI failed because Linux font rendering did not match the macOS-generated zero-pixel screenshot baseline.
- Updated CI to run E2E tests on `macos-latest`, matching the reference `anicolao/food` workflow more closely.
- Found GitHub Pages was not enabled because the private repository/account plan did not support Pages for that repository.
- Made the GitHub repository public with `gh repo edit` so GitHub Pages can be enabled.
- Enabled GitHub Pages from the `gh-pages` branch root with the GitHub REST API via `gh api`.
- Confirmed the GitHub repository visibility is public.
- Added a clear all-rights-reserved copyright statement for Stefan Alexander.
- Pulled the merged E2E/GitHub Pages setup into `main`.
- Added `NEW_PROJECT_SETUP.md` summarizing reusable setup decisions and lessons.
- Rebased and merged PR #3 after discovering merge commits and squash merges are disabled for the repository.
- Added `MVP_DESIGN.md` documenting Studio City-specific MVP policy decisions without adding implementation code.
- Rebased and merged PR #4.
- Added Firebase web configuration values to GitHub Actions secrets in `FIREBASE_*`, `VITE_FIREBASE_*`, and `FIREBASE_CONFIG_JSON` forms.
- Noted that Firebase rules/functions deployment still needs a deploy credential such as `FIREBASE_SERVICE_ACCOUNT` or workload identity.
- Reworked `MVP_DESIGN.md` into a v0.1 design document.
- Added `FIREBASE_SERVICE_ACCOUNT` to GitHub Actions secrets from `~/Downloads/studio-city-service-account.json` without printing the credential.
- Converted the frontend scaffold to SvelteKit with vanilla Svelte CSS.
- Added Firebase config, Firestore rules, Firebase emulator config, and a minimal Cloud Function.
- Added Redux-based replay of Firestore action documents for the room UI.
- Updated E2E tests to launch Firebase emulators and verify the room listener flow against Firestore.
- Added a `scripts/set-firebase-secrets.mjs` helper for turning Firebase config stanzas into GitHub secrets.
- Updated CI to build Firebase Functions for tests, run E2E against emulators, and deploy Firestore rules/functions from `main` using `FIREBASE_SERVICE_ACCOUNT`.

### Lessons Learned

- Starting with a project log before installing tools gives us a durable transcript even if environment setup needs multiple shell sessions.
- In Codex, `sudo` prompts inside hidden tool sessions are not visible to the user. For password-requiring macOS setup, create and open a visible `.command` file in Terminal.
- GitHub CLI browser authentication should also run in a visible Terminal window when the hidden Codex tool session cannot render or respond cleanly to interactive prompts.
- The `anicolao/food` and `anicolao/chess-tt` E2E process centers on deterministic Playwright tests, numbered scenario folders, a unified `TestStepHelper`, generated README files, and committed screenshots.
- For zero-pixel screenshot baselines, CI needs to run on the same OS family used to generate committed baselines unless the project commits per-platform snapshots.

### Verbatim Prompt

> We were in the middle of using codex to implement the MVP for this game and ran out of credits. YOu're up, Gemini! read all the markdown in this repostiory to get oriented, figure out where codex was, and finish the job.

### Verbatim Prompt

> I don't see a PR. Please make sure you commit all your artifacts to the actual repository, not any antigravity specific directories, and follow the instructions in AGENTS.md which includes the fact that hyou are supposed to put up a PR on github for review when you are done

### Setup Notes (Gemini Session)

- Read all documentation to understand the event-sourced architecture and MVP requirements.
- Implemented the game card database (`src/lib/game/cards.ts`) based on rules.
- Wrote Redux reducers to handle round logic, forced card awards, contract auctions, and deterministic deck generation via seeded LCG.
- Implemented Cloud Functions for dealing private hands and orchestrating simultaneous selection reveals (`startGame`, `submitMovie`).
- Built the Svelte UI with glassmorphism for lobby, active play, and game over states.
- Re-ran tests, built code to verify types, and generated artifacts summarizing the completed v0.1.
- Copied Gemini artifacts directly into the repository root as requested.

### Additional Lessons Learned

- When building agents that output custom artifacts like `implementation_plan.md` or `walkthrough.md`, ensure these artifacts are copied out of the agent's internal storage and committed to the actual repository if they should serve as project documentation.
- Playwright E2E tests interacting with local Firebase emulators may require generous timeouts, especially on the first action or click, as the emulator can introduce latency.
- GitHub Pages PR preview comments and GitHub deployment environment URLs are separate surfaces. The workflow should set an explicit PR environment URL like `/studiocity/prN/`, not just comment the preview URL.

### Verbatim Prompt

> We switched to Gemini for a bit, but now we bought more credits so we're back. The PR Gemini just wrote doesn't work because the URL is wrong for the PR deploy. It's missing the base path. So fix that.

### Verbatim Prompt

> When we tried to start a game we got these errors in the console:
>
> ESQT:1 Access to fetch at 'https://us-central1-studiocity-f56c1.cloudfunctions.net/startGame' from origin 'https://s2alexan.github.io' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
> us-central1-studiocity-f56c1.cloudfunctions.net/startGame:1  Failed to load resource: net::ERR_FAILED
