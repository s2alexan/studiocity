import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import type { GameAction, GameCode, LobbyConfig, PlayerId, StoredGameAction } from './actions';

export const DEFAULT_LOBBY_CONFIG: LobbyConfig = {
  minPlayers: 2,
  maxPlayers: 5,
  supportedStartHumanPlayers: 2,
  botsPlanned: true,
};

export function gameDocPath(gameCode: GameCode) {
  return `game/${gameCode}`;
}

export async function createRoom(
  db: Firestore,
  gameCode: GameCode,
  playerId: PlayerId,
  name: string,
) {
  const gameRef = doc(db, 'game', gameCode);
  const actionsRef = collection(gameRef, 'actions');
  const now = Date.now();

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(gameRef);
    if (snapshot.exists()) {
      throw new Error(`Room ${gameCode} already exists.`);
    }
    transaction.set(gameRef, {
      gameCode,
      createdAt: serverTimestamp(),
      version: '0.1',
    });
  });

  await addDoc(actionsRef, {
    type: 'ROOM_CREATED',
    at: now,
    actorId: playerId,
    payload: { gameCode, lobbyConfig: DEFAULT_LOBBY_CONFIG },
  } satisfies GameAction);

  await joinRoom(db, gameCode, playerId, name);
}

export async function joinRoom(
  db: Firestore,
  gameCode: GameCode,
  playerId: PlayerId,
  name: string,
) {
  const gameRef = doc(db, 'game', gameCode);
  await setDoc(
    doc(gameRef, 'players', playerId),
    {
      playerId,
      name,
      joinedAt: serverTimestamp(),
    },
    { merge: true },
  );

  const actionsRef = collection(gameRef, 'actions');
  const existing = await getDocs(
    query(actionsRef, orderBy('at', 'asc')),
  );
  const hasJoined = existing.docs.some((actionDoc) => {
    const data = actionDoc.data() as Partial<GameAction>;
    return data.type === 'PLAYER_JOINED' && data.payload?.playerId === playerId;
  });
  const roomExists = existing.docs.some((actionDoc) => {
    const data = actionDoc.data() as Partial<GameAction>;
    return data.type === 'ROOM_CREATED';
  });

  if (!roomExists) {
    throw new Error('Room not found.');
  }

  if (!hasJoined) {
    const gameStarted = existing.docs.some((actionDoc) => {
      const data = actionDoc.data() as Partial<GameAction>;
      return data.type === 'GAME_STARTED';
    });
    const playerSeats = new Map<PlayerId, number>();
    let legacyPlayerSeat = 0;
    for (const actionDoc of existing.docs) {
      const data = actionDoc.data() as Partial<GameAction>;
      if (data.type === 'PLAYER_JOINED' && data.payload?.role !== 'spectator') {
        if (typeof data.payload?.seatIndex === 'number') {
          playerSeats.set(data.payload.playerId, data.payload.seatIndex);
        } else {
          playerSeats.set(data.payload.playerId, legacyPlayerSeat);
        }
        legacyPlayerSeat++;
      }
      if (data.type === 'BOT_ADDED' && typeof data.payload?.seatIndex === 'number') {
        playerSeats.set(data.payload.botId, data.payload.seatIndex);
      }
      if (data.type === 'PLAYER_KICKED') {
        playerSeats.delete(data.payload.playerId);
      }
    }
    const occupiedSeats = new Set(playerSeats.values());
    const seatIndex = gameStarted
      ? undefined
      : Array.from({ length: DEFAULT_LOBBY_CONFIG.maxPlayers }, (_, index) => index)
        .find((index) => !occupiedSeats.has(index));
    const role = seatIndex === undefined ? 'spectator' : 'player';

    await addDoc(actionsRef, {
      type: 'PLAYER_JOINED',
      at: Date.now(),
      actorId: playerId,
      payload: {
        playerId,
        name,
        role,
        seatIndex,
        kind: 'human',
      },
    } satisfies GameAction);
  }
}

export function listenToActions(
  db: Firestore,
  gameCode: GameCode,
  onActions: (actions: StoredGameAction[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const actionsRef = collection(doc(db, 'game', gameCode), 'actions');
  return onSnapshot(
    query(actionsRef, orderBy('at', 'asc')),
    (snapshot) => {
      onActions(
        snapshot.docs.map((actionDoc) => ({
          ...(actionDoc.data() as GameAction),
          id: actionDoc.id,
        })),
      );
    },
    onError,
  );
}

export async function claimSeat(db: Firestore, gameCode: GameCode, actorId: PlayerId, seatIndex: number) {
  const actionsRef = collection(doc(db, 'game', gameCode), 'actions');
  await addDoc(actionsRef, {
    type: 'SEAT_CLAIMED',
    at: Date.now(),
    actorId,
    payload: { seatIndex }
  } satisfies GameAction);
}

export async function addBot(db: Firestore, gameCode: GameCode, actorId: PlayerId, seatIndex: number) {
  const actionsRef = collection(doc(db, 'game', gameCode), 'actions');
  await addDoc(actionsRef, {
    type: 'BOT_ADDED',
    at: Date.now(),
    actorId,
    payload: {
      botId: `bot-${crypto.randomUUID()}`,
      name: `Bot ${seatIndex + 1}`,
      seatIndex,
      kind: 'bot',
    },
  } satisfies GameAction);
}

export async function renamePlayer(
  db: Firestore,
  gameCode: GameCode,
  actorId: PlayerId,
  playerId: PlayerId,
  name: string,
) {
  const actionsRef = collection(doc(db, 'game', gameCode), 'actions');
  await addDoc(actionsRef, {
    type: 'PLAYER_RENAMED',
    at: Date.now(),
    actorId,
    payload: { playerId, name },
  } satisfies GameAction);
}

export async function kickPlayer(
  db: Firestore,
  gameCode: GameCode,
  actorId: PlayerId,
  playerId: PlayerId,
) {
  const actionsRef = collection(doc(db, 'game', gameCode), 'actions');
  await addDoc(actionsRef, {
    type: 'PLAYER_KICKED',
    at: Date.now(),
    actorId,
    payload: { playerId },
  } satisfies GameAction);
}

export async function chooseContract(
  db: Firestore,
  gameCode: GameCode,
  actorId: PlayerId,
  round: number,
  contractId: string,
  afterAt: number,
) {
  const actionsRef = collection(doc(db, 'game', gameCode), 'actions');
  await addDoc(actionsRef, {
    type: 'CONTRACT_CHOSEN',
    at: Math.max(Date.now(), afterAt + 1),
    actorId,
    payload: { round, contractId }
  } satisfies GameAction);
}

export async function openSummary(db: Firestore, gameCode: GameCode, actorId: PlayerId, afterAt: number) {
  const actionsRef = collection(doc(db, 'game', gameCode), 'actions');
  await addDoc(actionsRef, {
    type: 'SUMMARY_OPENED',
    at: Math.max(Date.now(), afterAt + 1),
    actorId,
    payload: {},
  } satisfies GameAction);
}

export function listenToPrivateData(
  db: Firestore,
  gameCode: GameCode,
  playerId: PlayerId,
  onData: (data: { hand: string[]; chosenMovie: string | null } | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const privateRef = doc(db, 'game', gameCode, 'private', playerId);
  return onSnapshot(
    privateRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        onData(docSnapshot.data() as { hand: string[]; chosenMovie: string | null });
      } else {
        onData(null);
      }
    },
    onError,
  );
}
