# Studio City

Studio City is a 2-5 player card game about rival movie studios choosing the release order for their slate of films. Each studio starts with six movie cards and plays five rounds. In every round, players secretly choose a movie, reveal simultaneously, then compete across three auctions: box office, reviews, and streaming contracts.

At the end of five rounds, completed contracts and box office earnings determine the winning studio.

## Current Rules

Rules target: **Studio City (triple auction) v10**

### Players

2-5 players.

### Components

108 cards:

- 31 movie cards. Each movie has a rank from 0-30 in three categories: box office, reviews, and contracts. The three ranks always add to 45.
- 25 box office cards with 1-4 bills. Cards with 3 or 4 bills are blockbusters.
- 25 review cards with 1-4 stars. Cards with 3 or 4 stars are loved.
- 27 contract cards with values from 3-9.

Contract cards score only when their condition is met. Conditions can require specific totals of bills, stars, blockbuster icons, loved icons, and sometimes comparisons with the player's right neighbor. Higher-value contracts are generally stronger, with v10 contract balance informed by Monte Carlo simulation.

### Setup

Shuffle the movie cards and deal six to each player. Return unused movie cards to the box, out of the game.

Shuffle the box office, review, and contract decks separately. Place each deck face down in the middle.

### Round Flow

The game lasts five rounds.

At the start of each round:

- Reveal box office cards equal to the number of players and arrange them from lowest to highest.
- Reveal review cards equal to the number of players and arrange them from lowest to highest.
- Reveal contract cards until there is one more available contract than the number of players. Contracts do not need to be arranged.

All players secretly choose one movie card from their hand and place it face down. Once everyone has chosen, reveal all selected movies.

### Triple Auction

Box office is awarded first:

- Compare the selected movies by box office rank.
- The highest box office rank takes the highest box office card.
- The second-highest rank takes the second-highest box office card, and so on.
- Players cannot choose a different box office card.

Reviews are awarded next using the same forced-order process, based on review rank.

Contracts are awarded last:

- Compare selected movies by contract rank.
- The highest contract rank chooses one available contract card.
- The next-highest contract rank chooses next, and so on.
- Because one more contract than the player count is available, one contract remains after selection.
- The leftover contract stays available for the next round.

After all awards are taken, played movie cards are discarded face down. Box office, review, and contract cards remain face up in front of each player.

### End Game And Scoring

After five rounds, each player has one unreleased movie left in hand. Put it face up in front of that player.

Scoring:

- Completed contracts score their printed value.
- Incomplete contracts score zero.
- Box office cards score their bill value.
- Review cards do not score directly; they only help complete contracts.

The player with the most points wins.

## Development

This repository uses a Nix flake for a reproducible development shell and Bun for TypeScript package management.

Enter the development environment:

```sh
nix develop
```

The current dev shell provides:

- Bun
- GitHub CLI
- Git
