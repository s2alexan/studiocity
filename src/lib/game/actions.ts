export type GameCode = string;
export type PlayerId = string;

export interface LobbyConfig {
  minPlayers: number;
  maxPlayers: number;
  supportedStartHumanPlayers: number;
  botsPlanned: boolean;
}

export type GameAction =

  | {
      id?: string;
      type: 'ROOM_CREATED';
      at: number;
      actorId: PlayerId;
      payload: {
        gameCode: GameCode;
        lobbyConfig?: LobbyConfig;
      };
    }
  | {
      id?: string;
      type: 'PLAYER_JOINED';
      at: number;
      actorId: PlayerId;
      payload: {
        playerId: PlayerId;
        name: string;
        role?: 'player' | 'spectator';
        seatIndex?: number;
        kind?: 'human';
      };
    }
  | {
      id?: string;
      type: 'BOT_ADDED';
      at: number;
      actorId: PlayerId;
      payload: {
        botId: PlayerId;
        name: string;
        seatIndex: number;
        kind: 'bot';
      };
    }
  | {
      id?: string;
      type: 'SEAT_CLAIMED';
      at: number;
      actorId: PlayerId;
      payload: {
        seatIndex: number;
      };
    }
  | {
      id?: string;
      type: 'GAME_STARTED';
      at: number;
      actorId: PlayerId;
      payload: {
        // the server generates initial hands for the private documents, but we need
        // the public random seed to deterministically draw the market decks in reducers.
        seed: number;
      };
    }
  | {
      id?: string;
      type: 'MOVIE_SELECTED';
      at: number;
      actorId: PlayerId;
      payload: {
        round: number;
      };
    }
  | {
      id?: string;
      type: 'MOVIES_REVEALED';
      at: number;
      actorId: PlayerId; // usually the "SYSTEM" or the last player who submitted
      payload: {
        round: number;
        choices: Record<PlayerId, string>; // PlayerId -> MovieCard ID
      };
    }
  | {
      id?: string;
      type: 'FINAL_MOVIES_REVEALED';
      at: number;
      actorId: PlayerId;
      payload: {
        round: number;
        unreleasedMovies: Record<PlayerId, string>;
      };
    }
  | {
      id?: string;
      type: 'CONTRACT_CHOSEN';
      at: number;
      actorId: PlayerId;
      payload: {
        round: number;
        contractId: string;
      };
    }
  | {
      id?: string;
      type: 'SUMMARY_OPENED';
      at: number;
      actorId: PlayerId;
      payload: Record<string, never>;
    };

export interface StoredGameAction extends GameAction {
  id: string;
}

export function isGameCode(value: string): value is GameCode {
  return /^[A-Z]{4}$/.test(value);
}

export function createPlayerId(): PlayerId {
  return crypto.randomUUID();
}

export function createGameCode(): GameCode {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}
