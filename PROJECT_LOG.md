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

### Verbatim Prompt

> look in ~/Downloads for the csv adn .zip export of the cards, and tell me what the filenames are, then stop.

### Verbatim Prompt

> That looks right! integrate the real cards into the implementation. Also when we started a game, we didn't see our hands, make sure the UI shows each player their hand.

### Verbatim Prompt

> OK, this looks good, I merged the PR into main. Next I want to fix the card appearance - the ones in the app don't look like my actual cards. You can examine the png's in /downloads/Studio City - card design.
> - movie cards are portrait, all other cards are landscape
> - all movie cards have the same back, all box office cards have the same back, all reviews have the same back, and all contracts have the same back. In the folder each card has a custom unique png for its back, but that's just an artifact of the component.studio export.
> - the contract_condition in the csv file uses tags recognized by component.studio. <ccb></ccb> tags, these are just formatting to make that text bold. Also, it refers to images using <image_name /> tags. You can find the actual images themselves in /downloads/links
>
> You can decide how to implement them. You can use my pngs, or you can render them on your own. But make them look the same. As a suggestion, since there are only 5 box office card types, and 5 review card types, it might not be worth it to render these from scratch, just using the pre-rendered pngs might make sense. But for the contract cards, maybe you want to reconstruct the card using background, text, and the icons provided. On the other hand maybe you might find it easier to just use the contract pngs themselves.
>
> Just as always, implement this as a PR

### Setup Notes

- Inspected the Component Studio PNG export in `~/Downloads/Studio City - card design` and shared assets in `~/Downloads/links`.
- Chose pre-rendered card art for all card faces to maximize visual fidelity quickly.
- Rotated box office, review, and contract exports 90 degrees because their PNG files are portrait-shaped but the intended card design is landscape.
- Added normalized web-sized card art under `static/card-art` instead of committing the full print-sized export.
- Updated E2E screenshots so the hand and market show real card art while normalizing random card choices to stable images for snapshot reliability.

### Verbatim Prompt

> There are only 4 types of money cards, and 4 types of review cards. There were png's for all of them in the links directory only because that's the way component.studio does its exports. Fix everything up such that you're only using 1 png for each type of money/review card, even though there are multiple copies of it.

### Setup Notes

- Collapsed box office face art to one shared PNG per bill value at `static/card-art/faces/money/`.
- Collapsed review face art to one shared PNG per review type at `static/card-art/faces/review/`.
- Kept duplicated movie and contract faces because those cards have distinct rendered content.

### Verbatim Prompt

> I want to change the UI. Before we make any actual code changes, I want you to mock up the UI using generated mocked up screenshots, and we will iterate that way, until we find something I like.
> - At the very top, it should say "Studio City", in a fun movie-themed font
> - Below that, it should have the current round shown (Round x of 5), and also the status , for example "waiting for players to play movie cards", "your turn to pick a contract", etc.
> - For the market below that, it should show three rows of cards. Row 1: The stack of face-down box office cards, then the turned-over box office cards for that round. There should be enough space for 5 of them. Row 2: The stack of face-down review cards, then the turned-over review cards for that round. There should be enough space for 5 of them. Row 3: The stack of face-down contract cards, then the turned-over contract cards for that round. There should be enough space for 6 of them.
> - Below that should be a row with an info box for every player, with a summary of all players' important info: number of bills, number of stars, number of "loved" (hearts), number of "blockbusters" (tickets), and a written list of all contracts. Each contract should be shown as a single text line, with the contract value as well. The player's info box should be largest, but if players mouse over (or tap, on mobile) another player's box, then that box should temporarily become the largest.
> - Below that should be the player's hand. It should show all their movie cards.
> - I want this all beautifully laid out, like a real professional digital adaptation of a card game, high budget production, like a paid app on Steam would be. I like things simple and clean, not ornate, but I will want it looking a bit like a cinema/movie theme (but subtle).

### Verbatim Prompt

> That's very good. I like most of it. Make these changes:
> - Make the face-down box office, review, and contract decks the right aspect ratio - they are not square.
> - No need for the text labels for the 3 decks.
> - Box office, review, and contract cards need to all be the same size. And no need for the empty card spaces to the right of the cards.
> - Contracts inside the info box do not need the plus in front of the value. Also, I need the contract condition, not the contract title.
> - no need for the UI buttons in the top right of the screen.

### Verbatim Prompt

> OK, this is great. Now I want you to make the actual changes to the app, as a new PR. Carefully follow these notes:
> - I like the background, and the "Studio City" letters at the top. Generate clean versions of those assets and include them in the game.
> - For the card fronts and card backs, use the existing png assets you already have. Don't try to make new cards in the style of this mockup. I want you to use this mockup for the UI layout only, not new card art.
> - For the icons in the player boxes, use the actual png icons, rather than these new ones you made up, since the actual ones will match the icons on the cards. You can find them in /downloads/links on my drive.
> - You'll need to update all the tests, then run them again of course, fixing any errors.

### Setup Notes

- Generated clean `static/ui/cinema-background.png` and `static/ui/studio-city-title.png` assets from the approved UI mockup direction.
- Kept all card fronts and backs on the existing exported card PNG assets; the mockup is used only for layout and table atmosphere.
- Copied the real Component Studio icon PNGs into `static/ui/icons/` for player summary stats.
- Reworked the room screen into a cinema-table layout with market rows, expandable player summaries, and a persistent hand area.
- Updated E2E assertions and screenshots around the new visual structure while preserving emulator-backed game flow coverage.
- Normalized screenshot-only room codes, contract-turn status, and contract-card opacity in E2E tests so random room IDs and auction order do not make visual baselines flaky.

### Verbatim Prompt

> This is looking great. I merged the PR into main. Now a few more refinements:
> - The player info boxes have a responsive width, matching the other UI elements. I think this would look fine with 5 players, but with 2 players it results in them looking too wide. I think they should have a fixed width of 1/5 of the rest of the UI elements, that way they will always look the same with 2-5 players. I know the game only plays 2 players for now, that's fine, but I still want to style it to support 5 since that's a future addition.
> -  I want the contracts in the player info boxes to have an icon, to the left of the cost, showing its status. If it's definitely complete, regardless of whatever else the player gets, then put a green check. If it's definitely failed, regardless of whatever else the player gets, then put a red X. If it's still possible that it could be completed, or failed, depending on what the player gets next, put a third icon (I'm not sure what this should be, but choose something that indicates very clearly its TBD status). Make the text as large as possible, but still have it fit on one line.
> -  Also include the contract name in the status box, since there is room for it. But I want the name to be in thinner and lighter text, less noticeable, and the condition to be in bold text, much more noticeable.
> - In the player info box, for the contracts, list icons for bills, stars, etc. - instead of spelling out "stars", "bills", etc.
> - remove the animation that makes the player info boxes larger when you move over them. Just keep them the same size. However I want you to make it clear which info box is for that player - it doesn't have to be by size, but it should have a different border and be very clear.
> - on the start page (currently https://s2alexan.github.io/studiocity/pr9/, although it will eventually be at https://s2alexan.github.io/studiocity/), make this UI use the same background and style as the rest of the app. You forgot to style that page.

### Setup Notes

- Changed player info boxes to fixed one-fifth row slots so the layout is visually consistent for 2-5 players.
- Removed the player summary hover expansion and made the local player's box stand out with a clear green border, background, and focus-like glow.
- Added contract summary rows with status icons, value, lighter contract name, bold condition text, and real PNG condition icons.
- Added a conservative contract status evaluator based on current totals plus possible future award ranges; hidden or not-yet-computable conditions stay TBD until they can be known.
- Restyled the start page with the same generated cinema background and Studio City title asset used in the room UI.
- Updated E2E screenshots and normalized inserted screenshot HTML with inline icon sizing because Svelte scoped CSS does not apply to DOM built inside the test helper.

### Verbatim Prompt

> I Merged the PR into main.
>
> Now, make a new PR with the following changes:
> - The "player to right" icon is black, so is barely visible against the dark background of the player info box. Make the icon lighter so it's visible.
> - The UI area for face-up cards, and your hand, is too wide. Each player can have 6 cards max. Also, the most cards that can be face-up is the contracts in a 5-player game, where there is the face-down deck, and then 6 contracts. So make each UI area only as wide as is needed for the max number of cards there.
> - The contract text no longer fits in the player info box. To fix this, remove the contract title. I know I asked for this, but I changed my mind. Also, if needed, allow the contract text to wrap to a new line, but indent the line to line up with where the text starts the line above. Don't have the new line text start underneath the pass/fail/uncertain icon, or under the contract value.
> - The value of the contract in the player info box is currently always yellow. Instead, I want it to track the colour of the pass/failed/uncertain icon next to the contract.
> - At the end of the fifth round, I don't want to instantly go to the summary screen. I want players to be able to see what has happened this round. So in the round and info status (right under "Studio City") at the top, just show "game complete - click here for summary", and then style it to be clearly clickable, and when any player clicks that, then it goes to the end screen. The end screen should show a table. Players are in columns. For each player the first row should be their total points from bills. And then one row for each contract, showing the same info as in the player info box, styled the same way - pass/fail, and the value, and the contract description. And then at the bottom row, a total score, and having the winner column highlighted somehow.

### Setup Notes

- Added a `final_round_complete` projection status so the fifth round remains visible after the last contract pick.
- Added a `SUMMARY_OPENED` user-input action, a Firestore writer, and rules support so any player can explicitly move the shared room to the summary table.
- Narrowed the market width to the maximum 5-player contract row: one deck plus six face-up contracts. Narrowed the hand area to six movie cards.
- Removed contract titles from player summary rows, allowed condition text to wrap from its own text column, and colored contract values to match complete/failed/TBD status.
- Lightened the `player_to_right` icon in contract condition text so it stays readable on dark player boxes.
- Added a column-based final summary table with bill points, contract rows, totals, and highlighted winner columns.
- Extended the E2E flow through all five rounds to verify that the summary table only appears after clicking the game-complete status.

### Verbatim Prompt

> I did not yet check in the PR as there are bugs:
>
> My hand - this area needs to be a bit wider, on one screen it wrapped, with 5 cards on one row and one card below. on another screen it didn't wrap. Ensure it's as wide as needed so it doesn't wrap, all hand cards must be in a single row.
> It's now not clear that the contract cost (in player info box) is not part of the contract condition. So Put a colon after the cost, but before the condition text.
> At the end of the 5th round, the contracts that compare unreleased cards with your right neighbour were still marked with question marks. But as this is the 5th round, they should now be able to pass/fail.
> Missing or insufficient permissions error on the game summary screen. It flashes some kind of table briefly, then displays the error and goes back to showing end of 5th round. Did you use some firebase functions? Did you push the changes there? Remember you have to do this from the command line on my mac.

### Setup Notes

- Kept hand cards on one row by making the hand card strip non-wrapping and giving the hand panel extra width/overflow room.
- Added a colon after contract values in player summaries and the final summary table to separate value from condition.
- Added a final public `FINAL_MOVIES_REVEALED` action emitted by `submitMovie` on round 5 so unreleased-movie comparison contracts can resolve to pass/fail.
- Updated scoring so unreleased-rank contracts score only when their actual final comparison succeeds.
- The summary permission issue was caused by Firestore rules not yet being deployed to Firebase; deploy rules/functions from the Mac after landing this fix.

### Verbatim Prompt

> Let's start some changes for a new PR. First, a couple of small changes:
>
> It seems in the game summary screen the failed contracts are still being added to the final score. Remember the scoring should be bills plus successfully completed contracts.
> Also in the game summary screen, and in the player info box, when showing contracts, use an extra space in between the colon and the contract text. I think that should help separate them even more.
>
> Next, a big change. I want you to add animations so that it's more obvious what's happening in the game. All the instant transitions can be confusing. I want animations to move slowly - a little bit more slowly and deliberately than would be typical for a game like this, because I want to be able to see them clearly when debugging. Use a global variable for animation speed - hard code it for now but make it easy to change because I will be asking you to change animation speed in the future to tweak things.
> - You will have to change your tests to disable animations during testing - this is fine. Because you may grab the animation at the wrong frame and then the test will fail.
> - When players choose a movie card to play, I want the "your hand" UI box to disappear (along with all your movie cards in your hand), and the movie card they selected to flip over, and then appear underneath your player info box. And then, all the other players' selected movie cards (face down) can be shown under their player info box too, because the "your hand" UI box is gone and now there's room. Just to be clear, I don't want you showing other player's face-down movie cards below the player info box, even if that player has selected their movie card, UNTIL you have selected your movie card, because of the obvious reason that there won't be anywhere to show that movie card.
> - Once all players have played a movie card, and they are all showing face down below the player info box, then flip all the movie cards over.
> - Then, you can automatically give out the box office and review cards, but I want this animated, and I want it slow and deliberate. First, the highest box office card goes to the correct player. The player's movie card should be selected and pulse gently, and the box office card should be selected and pulse gently, then the card should move down to the player's info box, it should get absorbed into the info box, and then the appropriate icons should update, in an animated way, making it obvious what has been updated. Then, the next-highest box office card goes to the correct player, etc. I'm roughly specifying what I want with the animations - like when I say pulse - but I want you to use your judgement about what a typical high-budget steam card game might do for such an animation and make it look really great and professional. Don't take my animation suggestions literally if they are going to look ugly.
> - Give out all box office and review cards this way.
> - For the contracts, when it is a player's turn, their movie card should get selected and pulse (or whatever), and then when they select the contract, it should move down to their player info box and get absorbed, just like the other cards did, and then the contract should get added to the player info box.
> - I also want the box office, review, and contract decks to look more like decks, right now it just looks like one face-down card. Make them look like a higher stack of cards. And then, at the beginning of each round, when you put out new cards, show them animated, coming off the top of the stacks, so it looks like they are being dealt.

### Setup Notes

- Changed final scoring to use the same contract status evaluator as the UI, so only completed contracts add points.
- Added an extra visual space after contract value colons in player summaries and final summary rows.
- Added a hard-coded `GAME_ANIMATION_SPEED_MS` speed variable and a reduced-motion/local-storage path that disables animations for E2E tests.
- Added a played-movie row beneath player boards: the hand disappears after local selection, the local selected card appears there, and revealed round movies flip into face-up cards.
- Added slow visual sequencing hooks for award focus, stat updates, contract receipt, market dealing, and taller-looking deck stacks while keeping recorded game actions limited to the existing event-sourced user/system actions.
- Updated E2E screenshot normalization for the new played-movie row and regenerated affected screenshots.

### Verbatim Prompt

> Issues with this PR:
> - The box office, review, and contract stacks look like single face-down cards, not stacks.
> - When one player chooses a movie card, their hand disappears (this is correct), and the face-down movie card appears under their player info box (which is correct). But then that player's movie card flips (incorrect), and also there is some kind of scroll bar appearing in a frame holding these face-down movie cards (incorrect). Also I also saw another player's face-down movie card appear under their info box - but that player hadn't yet selected their movie card! This is incorrect. A player's face-down, selected, movie card should appear under their player info box, for them, and for all other players, at the same time. Only when all players have selected their movie cards should all players' movie cards be flipped face-up, for everyone, at the same time.
> - There are no animations showing the box office and review cards moving into player info boxes. Either you did not implement it, or it's broken. I slowed animations to 10% in Chrome and it still happened instantly. As an example, I would want the box office and review cards to take 1-2 seconds each to move towards their player info boxes. Are all the animations running locally? Did you need to push anything to Firebase? Remember that has to happen explicitely, and locally on my mac.
> - The pulse animation is annoying. I do want "active" cards, to look selected, with an outline around them that is pulsing in its glow. But do not make the card itself pulse in size.
> - Everything feels a little bit laggy. When I click, it can take some time to react - but then I still don't see any animations, everything just jumps to the next state. I want everything to feel very snappy when I click on something, but then for the animations to start instantly and play smoothly and slowly.
> - You did not implement the animations properly for dealing the box office, review, and contract cards at the beginning of the round. The cards slide, fading into existence, from the previous card - not from the deck. I want to see a single card come off the deck, and be flipped onto its face-up side, as it moves over to its correct place.

### Setup Notes

- Added a public `MOVIE_SELECTED` action that records only the user-input fact that a player selected a movie, without exposing the movie identity.
- Updated the selected-movie row to show only players who have actually selected, keep all selected cards face-down until `MOVIES_REVEALED`, and remove the horizontal scrollbar.
- Added an immediate optimistic local selected-card state so clicking a movie hides the hand and shows the selected back right away while the function call completes.
- Reworked deck styling to expose more layered card edges.
- Replaced size-pulsing active-card animation with a pulsing outline/glow.
- Added visible flying award-card clones for box office and review award playback, with each award beat taking roughly 1.6 seconds.
- Changed deal-in animation so market cards start from the deck side and rotate toward face-up placement instead of sliding from the previous card.

### Verbatim Prompt

> - deck dealing animations are better, but remove transparency. I want the cards opaque.
> - decks still look like single cards, not decks, It's because the bottom cards in the deck are dark grey. You need to stack 10 card back images on top of each other, but each card offset up and to the left by a small amount, with a drop shadow around the entire card. That will now look like a proper deck. It's important that the bottom card in the stack is aligned with the cards that are flipped face-up, because that's the "table". Therefore the top card will end up slightly higher in the y direction than the flipped over cards, which is what helps maintain the illusion of it looking like a stack.
> - When player 1 chooses a movie card, it should not appear for other players until after they have also chosen their movie card. The right way to think about this is that there is a "your hand" UI frame, and a "other player's face-down movie cards" UI frame. When you see your hand, you can't see any face down movie cards, because that frame isn't visible. Once you select a card, your hand disappears, and is replaced by the other player movie card frame, where you can then see your face down card, and any other player's cards that got selected. And then once everyone has selected, the cards are flipped face-up.
> - The animations are a mess. Let's fix one step at a time. For this update, just fix two things. One, the proper deck animation flipping over cards at the beginning of the round. Two, the selection of movie cards, and the "your hand" to "face down movie card" part.

### Setup Notes

- Removed the box office/review award animation layer from this PR pass so only market dealing and movie selection transitions are changing.
- Rebuilt each deck stack from 10 real card-back images, offset up and left from a bottom card that aligns with the face-up card row.
- Removed opacity fading from the deal animation and added a card-back overlay so each dealt card appears to come off the deck face-down, flip, and land face-up.
- Changed the played-movie row so it stays hidden while the local player still has their hand, then replaces the hand after local selection and shows only players who have actually selected until the reveal.

### Verbatim Prompt

> - box office, review, and contract card dealing animations at beginning of round are not quite right. As each card flips off the deck, it needs to flip FROM its face-down side, and then onto its face-up side, and then stay on its face-up side. Currently, it flips from its face-down side, onto another face-down side, then changes to face-up without flipping, then changes again to face-down.
> - remove the status box at the bottom of the screen (e.g. displays "Waiting for Player1 to pick a contract...", etc.), as it's redundant with the status at the top of the screen

### Setup Notes

- Reworked market card dealing so the card container moves from the deck while the back overlay and front image perform one coordinated face-down-to-face-up flip.
- Removed the redundant bottom status notice below the play area; the top status strip remains the single source of visible game status.

### Verbatim Prompt

> The cards still end up face down

### Setup Notes

- Made the deal-animation card-back overlay disappear after the halfway point of the flip so the final resting card cannot remain visually face-down.
- Fixed the resting CSS state too: because the animation uses `backwards`, the card-back overlay must be hidden in the base style after the animation completes.

### Verbatim Prompt

> slow down the card flipping animation by half. Also, once all players have selected movie cards, and the correct UI boxes are hidden and shown, and all those animations have played for all players, THEN make sure the selected movie cards all flip over onto their face up side, animated, slowly. This must happen BEFORE box office and review cards are distributed.

### Setup Notes

- Doubled the market-card deal/flip animation duration while leaving the existing animation speed variable in place for future tuning.
- Added a presentation-only movie reveal gate in the room UI: after `MOVIES_REVEALED`, the table briefly holds the pre-award state with all selected movie backs visible, then flips the selected movie cards face-up, then releases the awarded box office/review state.
- Kept this as UI staging only; the event-sourced game actions and Cloud Functions behavior are unchanged.

### Verbatim Prompt

> There is a bug, once all players have selected their movie cards, nothing happens, it won't go onto the next step

### Setup Notes

- Reproduced with animations enabled against the local Firebase emulators. The room page crashed when staging the movie reveal because `structuredClone` cannot clone the Svelte state proxy around the projection.
- Replaced `structuredClone` with a JSON clone for the plain-data game projection so the reveal timers can run and the UI advances to contract selection.

### Verbatim Prompt

> Now, I want a new lobby. This new lobby will support bots, and 2-5 players, but I don't yet want you implementing bots or 2-5 players. We will add those later. However in the lobby you should design it such that later, when I want to add bots and different numbers of players, the game configuration already supports that.
> - Initial home page shows only "name" field, "create room" button, and nothing else. No joining by code.
> - When create room clicked, then the game shows a table with 5 rows, one for each player. The first one is the player who created the room. And then there should be a button for "get link", which is a link to join the game. This can be the exact same URL format you are using to join games now! But the user just sends the URL to their friend, and when they click the link, they appear in the table as another player. There should also be a button for "add bot", which will populate the next available row in the table with a bot. If too many people click the link they can just be added as spectators, not part of the table, not playing the game. If there are 2-5 players, then the player who created the room has a button to start the game.
> - Right now, the lobby should fill in the table if extra people join, or if the user adds bots. But when the game starts, it should only support 2 human players. However store all the game configuration in some way so that when we add that functionality later, it's set up properly and you don't have to re-write all the lobby code.

### Setup Notes

- Simplified the homepage to only a name field and create-room button; joining now happens exclusively via room links.
- Added replayable lobby configuration to `ROOM_CREATED` and new seating metadata on `PLAYER_JOINED`, with five configured seats, spectator overflow, and a future-facing `BOT_ADDED` action.
- Reworked the lobby UI into a five-row player table with host-only get-link, add-bot, and start controls.
- Kept the current game-start path restricted to exactly two human players, while preserving bot and 3-5 player lobby data for later implementation.
- Updated Firestore rules and E2E coverage for the new lobby table and bot-reservation behavior.

### Verbatim Prompt

> Get link gave me https://s2alexan.github.io/studiocity/pr13/room/EIZZ - which seems correct - but when i pasted that into another browser window it gave me a 404. It should immediately add this new player to the lobby

### Setup Notes

- GitHub Pages serves the custom 404 from the published project root, not from nested PR preview directories, so direct links like `/studiocity/pr13/room/EIZZ` need a root fallback that understands PR preview base paths.
- Added a standalone Pages 404 redirect shim that stores the intended room route, redirects to the correct app shell (`/studiocity/` or `/studiocity/prNN/`), and lets the app restore the original route before SvelteKit boots.
- Changed the Pages workflow to publish PR previews under `prNN/` and the shared root fallback together, preserving the existing PR link format while making copied room URLs load directly.
- Updated room links to auto-join the visitor with their stored player name, or `Player` if they have no saved name yet, so there is no extra join-by-code step after opening an invite URL.

### Verbatim Prompt

> This seems to work. 2 features needed:
> - The host needs a way to kick players and bots out of the spot. If kicked, a players needs to be told they have been removed from the room.
> - players who join need a way to change their name. In fact, for simplicity, you can just remove the name field from the home page, and then all players (hosts, and those who join), can just edit their own name in the text field in the lobby table directly. The host should be able to edit bot names too.
>
> This might need some new firebase code, remember you can only push that from my mac.

### Setup Notes

- Removed the home-page name field; room creation now starts the host with the default lobby name `Player`.
- Added replayable `PLAYER_RENAMED` and `PLAYER_KICKED` lobby actions. Players can rename themselves in the lobby table, and the host can rename bots or kick occupied seats.
- Kicked players are removed from the lobby projection and see a dedicated removed-from-room notice instead of the normal auto-join panel.
- Updated join-seat derivation so kicked seats become reusable for future humans or bots.
- Updated Firestore rules to allow the new lobby input actions, and expanded E2E coverage for rename, human kick, bot rename, and bot kick.
