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

### Lessons Learned

- Starting with a project log before installing tools gives us a durable transcript even if environment setup needs multiple shell sessions.
- In Codex, `sudo` prompts inside hidden tool sessions are not visible to the user. For password-requiring macOS setup, create and open a visible `.command` file in Terminal.
- GitHub CLI browser authentication should also run in a visible Terminal window when the hidden Codex tool session cannot render or respond cleanly to interactive prompts.
- The `anicolao/food` and `anicolao/chess-tt` E2E process centers on deterministic Playwright tests, numbered scenario folders, a unified `TestStepHelper`, generated README files, and committed screenshots.
