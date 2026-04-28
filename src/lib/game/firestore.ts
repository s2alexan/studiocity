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
import type { GameAction, GameCode, PlayerId, StoredGameAction } from './actions';

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
    payload: { gameCode },
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

  if (!hasJoined) {
    await addDoc(actionsRef, {
      type: 'PLAYER_JOINED',
      at: Date.now(),
      actorId: playerId,
      payload: { playerId, name },
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

export async function chooseContract(db: Firestore, gameCode: GameCode, actorId: PlayerId, round: number, contractId: string) {
  const actionsRef = collection(doc(db, 'game', gameCode), 'actions');
  await addDoc(actionsRef, {
    type: 'CONTRACT_CHOSEN',
    at: Date.now(),
    actorId,
    payload: { round, contractId }
  } satisfies GameAction);
}

export function listenToPrivateData(
  db: Firestore,
  gameCode: GameCode,
  playerId: PlayerId,
  onData: (data: { hand: string[]; chosenMovie: string | null } | null) => void,
): Unsubscribe {
  const privateRef = doc(db, 'game', gameCode, 'private', playerId);
  return onSnapshot(privateRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      onData(docSnapshot.data() as { hand: string[]; chosenMovie: string | null });
    } else {
      onData(null);
    }
  });
}

