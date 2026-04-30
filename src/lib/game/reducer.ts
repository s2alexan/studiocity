import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { GameAction, GameCode, LobbyConfig, PlayerId, StoredGameAction } from './actions';
import { getBoxOfficeCard, getContractCard, getMovieCard, getReviewCard, BOX_OFFICE_DECK, REVIEW_DECK, CONTRACT_DECK } from './cards';
import { contractStatus } from './player-summary';

export interface Player {
  id: PlayerId;
  name: string;
  seatIndex: number;
  kind: 'human' | 'bot';
}

export interface Spectator {
  id: PlayerId;
  name: string;
}

export type GameStatus = 'lobby' | 'playing' | 'final_round_complete' | 'game_over';
export type RoundPhase = 'selection' | 'contract_auction';

export interface PlayerState {
  boxOffice: string[];
  reviews: string[];
  contracts: string[];
  score: number;
}

export interface GameProjection {
  gameCode: GameCode | null;
  players: Player[];
  spectators: Spectator[];
  lobbyConfig: LobbyConfig;
  status: GameStatus;
  round: number;
  phase: RoundPhase;
  market: {
    boxOffice: string[];
    reviews: string[];
    contracts: string[];
  };
  selectedMoviePlayers: Record<PlayerId, boolean>;
  playedMovies: Record<PlayerId, string>;
  unreleasedMovies: Record<PlayerId, string>;
  playerStates: Record<PlayerId, PlayerState>;
  contractPickOrder: PlayerId[]; // Who still needs to pick a contract this round
  actionCount: number;
  lastActionType: GameAction['type'] | null;
  seed: number;
}

export interface GameState {
  localPlayerId: PlayerId | null;
  actions: StoredGameAction[];
  projection: GameProjection;
}

export const initialProjection: GameProjection = {
  gameCode: null,
  players: [],
  spectators: [],
  lobbyConfig: {
    minPlayers: 2,
    maxPlayers: 5,
    supportedStartHumanPlayers: 2,
    botsPlanned: true,
  },
  status: 'lobby',
  round: 1,
  phase: 'selection',
  market: { boxOffice: [], reviews: [], contracts: [] },
  selectedMoviePlayers: {},
  playedMovies: {},
  unreleasedMovies: {},
  playerStates: {},
  contractPickOrder: [],
  actionCount: 0,
  lastActionType: null,
  seed: 0,
};

export const initialState: GameState = {
  localPlayerId: null,
  actions: [],
  projection: initialProjection,
};

// Simple LCG for deterministic shuffling
function lcg(seed: number) {
  return function () {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function shuffle<T>(array: T[], random: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function setupRoundMarket(projection: GameProjection, rng: () => number) {
  const numPlayers = projection.players.length;
  // Box office and reviews drawn equal to num players
  // Contracts drawn equal to num players + 1, keeping leftovers
  
  // To keep it perfectly replayable, we just shuffle the original decks based on the seed
  // and pull what we need based on the round number.
  // We recreate the full shuffled decks first:
  const boDeck = shuffle(BOX_OFFICE_DECK.map(c => c.id), rng);
  const revDeck = shuffle(REVIEW_DECK.map(c => c.id), rng);
  const contractDeck = shuffle(CONTRACT_DECK.map(c => c.id), rng);

  // We are at round `projection.round` (1-indexed)
  const roundIdx = projection.round - 1;
  
  projection.market.boxOffice = boDeck.slice(roundIdx * numPlayers, (roundIdx + 1) * numPlayers)
    .sort((a, b) => getBoxOfficeCard(a).bills - getBoxOfficeCard(b).bills); // lowest to highest
    
  projection.market.reviews = revDeck.slice(roundIdx * numPlayers, (roundIdx + 1) * numPlayers)
    .sort((a, b) => getReviewCard(a).stars - getReviewCard(b).stars); // lowest to highest

  // Contracts: keep leftovers. We draw numPlayers + 1 initially. Then 1 is left over.
  // Each round we need `numPlayers` MORE contracts to make it `numPlayers + 1` again.
  // Round 1: 0 to numPlayers+1
  // Round 2: numPlayers+1 to 2*numPlayers+1
  const cStart = roundIdx === 0 ? 0 : (roundIdx * numPlayers) + 1;
  const cEnd = cStart + (roundIdx === 0 ? numPlayers + 1 : numPlayers);
  
  const newContracts = contractDeck.slice(cStart, cEnd);
  projection.market.contracts.push(...newContracts);
  // Contracts don't need sorting, but we can sort by value for UI
  projection.market.contracts.sort((a, b) => getContractCard(a).value - getContractCard(b).value);
}

function evaluateScore(projection: GameProjection, playerId: PlayerId): number {
  const playerState = projection.playerStates[playerId];
  let score = 0;
  
  const totalBills = playerState.boxOffice.reduce((sum, id) => sum + getBoxOfficeCard(id).bills, 0);

  // Box office cards are worth their bills
  score += totalBills;

  // Completed contracts score their value; failed or still-pending contracts score nothing.
  for (const cId of playerState.contracts) {
    const c = getContractCard(cId);
    if (contractStatus(c, projection, playerId) === 'complete') {
      score += c.value;
    }
  }

  return score;
}

function replay(actions: StoredGameAction[]): GameProjection {
  return actions.reduce<GameProjection>(
    (projection, action) => {
      projection.actionCount++;
      projection.lastActionType = action.type;

      switch (action.type) {
        case 'ROOM_CREATED':
          projection.gameCode = action.payload.gameCode;
          projection.lobbyConfig = action.payload.lobbyConfig ?? projection.lobbyConfig;
          break;
          
        case 'PLAYER_JOINED': {
          const exists = projection.players.some(p => p.id === action.payload.playerId);
          const isSpectator = action.payload.role === 'spectator';
          const spectatorExists = projection.spectators.some(p => p.id === action.payload.playerId);
          if (isSpectator && !exists && !spectatorExists) {
            projection.spectators.push({ id: action.payload.playerId, name: action.payload.name });
          } else if (!exists && !spectatorExists) {
            projection.players.push({
              id: action.payload.playerId,
              name: action.payload.name,
              seatIndex: action.payload.seatIndex ?? projection.players.length,
              kind: action.payload.kind ?? 'human',
            });
            projection.playerStates[action.payload.playerId] = {
              boxOffice: [], reviews: [], contracts: [], score: 0
            };
          }
          break;
        }

        case 'BOT_ADDED': {
          const exists = projection.players.some(p => p.id === action.payload.botId);
          if (!exists) {
            projection.players.push({
              id: action.payload.botId,
              name: action.payload.name,
              seatIndex: action.payload.seatIndex,
              kind: 'bot',
            });
            projection.playerStates[action.payload.botId] = {
              boxOffice: [], reviews: [], contracts: [], score: 0
            };
          }
          break;
        }

        case 'SEAT_CLAIMED': {
          const p = projection.players.find(p => p.id === action.payload.actorId);
          if (p) p.seatIndex = action.payload.seatIndex;
          break;
        }

        case 'GAME_STARTED': {
          projection.status = 'playing';
          projection.seed = action.payload.seed;
          const rng = lcg(projection.seed);
          setupRoundMarket(projection, rng);
          break;
        }

        case 'MOVIE_SELECTED': {
          if (action.payload.round === projection.round) {
            projection.selectedMoviePlayers[action.actorId] = true;
          }
          break;
        }

        case 'MOVIES_REVEALED': {
          projection.playedMovies = action.payload.choices;
          projection.selectedMoviePlayers = {};
          
          // Compute forced awards
          // Sort players by Box Office rank of their played movie
          const boOrder = [...projection.players].sort((a, b) => {
            const rankA = getMovieCard(projection.playedMovies[a.id]).boxOfficeRank;
            const rankB = getMovieCard(projection.playedMovies[b.id]).boxOfficeRank;
            return rankB - rankA; // Highest rank gets first pick
          });

          // Sort players by Review rank
          const revOrder = [...projection.players].sort((a, b) => {
            const rankA = getMovieCard(projection.playedMovies[a.id]).reviewRank;
            const rankB = getMovieCard(projection.playedMovies[b.id]).reviewRank;
            return rankB - rankA;
          });

          // Sort players by Contract rank for picking
          projection.contractPickOrder = [...projection.players].sort((a, b) => {
            const rankA = getMovieCard(projection.playedMovies[a.id]).contractRank;
            const rankB = getMovieCard(projection.playedMovies[b.id]).contractRank;
            return rankB - rankA;
          }).map(p => p.id);

          // Give Box Office awards (highest rank -> highest card, and highest cards are at the end of the array)
          // market.boxOffice is sorted lowest to highest.
          // boOrder is sorted highest rank to lowest rank.
          for (let i = 0; i < boOrder.length; i++) {
            const pId = boOrder[i].id;
            const cardId = projection.market.boxOffice.pop(); // takes the highest available
            if (cardId) projection.playerStates[pId].boxOffice.push(cardId);
          }

          // Give Review awards
          for (let i = 0; i < revOrder.length; i++) {
            const pId = revOrder[i].id;
            const cardId = projection.market.reviews.pop();
            if (cardId) projection.playerStates[pId].reviews.push(cardId);
          }

          projection.phase = 'contract_auction';
          break;
        }

        case 'FINAL_MOVIES_REVEALED': {
          projection.unreleasedMovies = action.payload.unreleasedMovies;
          break;
        }

        case 'CONTRACT_CHOSEN': {
          const pId = action.actorId;
          const { contractId } = action.payload;
          
          // Ensure it's this player's turn
          if (projection.contractPickOrder[0] === pId) {
            projection.contractPickOrder.shift(); // remove from pick order
            
            // remove from market
            projection.market.contracts = projection.market.contracts.filter(id => id !== contractId);
            projection.playerStates[pId].contracts.push(contractId);
            
            // Is round over?
            if (projection.contractPickOrder.length === 0) {
              projection.playedMovies = {};
              
              if (projection.round === 5) {
                projection.status = 'final_round_complete';
                // Final score calculation
                for (const p of projection.players) {
                  projection.playerStates[p.id].score = evaluateScore(projection, p.id);
                }
              } else {
                projection.round++;
                projection.phase = 'selection';
                projection.selectedMoviePlayers = {};
                const rng = lcg(projection.seed);
                setupRoundMarket(projection, rng);
              }
            }
          }
          break;
        }

        case 'SUMMARY_OPENED': {
          if (projection.status === 'final_round_complete') {
            projection.status = 'game_over';
          }
          break;
        }
      }
      return projection;
    },
    JSON.parse(JSON.stringify(initialProjection)) // deep clone for clean start
  );
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setLocalPlayerId(state, action: PayloadAction<PlayerId>) {
      state.localPlayerId = action.payload;
    },
    replayActions(state, action: PayloadAction<StoredGameAction[]>) {
      state.actions = action.payload;
      state.projection = replay(action.payload);
    },
  },
});

export const { replayActions, setLocalPlayerId } = gameSlice.actions;
export const gameReducer = gameSlice.reducer;
