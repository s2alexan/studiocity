import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/https';

initializeApp();

const MOVIE_IDS = Array.from({ length: 31 }).map((_, i) => `_movie_${i + 1}`);
const callableOptions = {
  cors: [
    'https://s2alexan.github.io',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
    'http://localhost:5173',
    'http://localhost:4173',
  ],
  invoker: 'public',
};

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const startGame = onCall(callableOptions, async (request) => {
  const { gameCode, actorId, playerIds } = request.data as {
    gameCode: string;
    actorId: string;
    playerIds: string[];
  };

  if (!/^[A-Z]{4}$/.test(gameCode)) {
    throw new HttpsError('invalid-argument', 'Expected a four-letter room code.');
  }

  const db = getFirestore();
  const gameRef = db.collection('game').doc(gameCode);

  // Write game info to metadata
  await gameRef.collection('metadata').doc('gameInfo').set({ playerIds });

  const deck = shuffle(MOVIE_IDS);
  const batch = db.batch();

  // Deal 6 cards to each player
  for (let i = 0; i < playerIds.length; i++) {
    const pId = playerIds[i];
    const hand = deck.slice(i * 6, (i + 1) * 6);
    const privateRef = gameRef.collection('private').doc(pId);
    batch.set(privateRef, { hand, chosenMovie: null });
  }

  // Write GAME_STARTED action
  const actionRef = gameRef.collection('actions').doc();
  batch.set(actionRef, {
    type: 'GAME_STARTED',
    at: Date.now(),
    actorId,
    payload: { seed: Date.now() },
  });

  await batch.commit();

  return { success: true };
});

export const submitMovie = onCall(callableOptions, async (request) => {
  const { gameCode, actorId, round, movieId } = request.data as {
    gameCode: string;
    actorId: string;
    round: number;
    movieId: string;
  };

  if (!/^[A-Z]{4}$/.test(gameCode)) {
    throw new HttpsError('invalid-argument', 'Expected a four-letter room code.');
  }

  const db = getFirestore();
  const gameRef = db.collection('game').doc(gameCode);

  await db.runTransaction(async (transaction) => {
    const gameInfoRef = gameRef.collection('metadata').doc('gameInfo');
    const gameInfoDoc = await transaction.get(gameInfoRef);
    if (!gameInfoDoc.exists) throw new HttpsError('failed-precondition', 'Game not started.');
    
    const playerIds = gameInfoDoc.data()?.playerIds as string[];

    const privateRef = gameRef.collection('private').doc(actorId);
    const privateDoc = await transaction.get(privateRef);
    if (!privateDoc.exists) throw new HttpsError('not-found', 'Player not found.');

    const privateData = privateDoc.data()!;
    const hand = privateData.hand as string[];
    
    if (!hand.includes(movieId)) {
      throw new HttpsError('invalid-argument', 'Movie not in hand.');
    }

    // Move movie from hand to chosenMovie
    const newHand = hand.filter(m => m !== movieId);
    transaction.update(privateRef, { hand: newHand, chosenMovie: movieId });

    // Check if all players have submitted
    const choices: Record<string, string> = {};
    choices[actorId] = movieId; // Optimistically add current player

    let allSubmitted = true;
    for (const pId of playerIds) {
      if (pId === actorId) continue;
      const pDoc = await transaction.get(gameRef.collection('private').doc(pId));
      const pData = pDoc.data();
      if (!pData || !pData.chosenMovie) {
        allSubmitted = false;
        break;
      }
      choices[pId] = pData.chosenMovie;
    }

    if (allSubmitted) {
      // Clear chosenMovie for all players
      for (const pId of playerIds) {
        transaction.update(gameRef.collection('private').doc(pId), { chosenMovie: null });
      }

      // Write MOVIES_REVEALED action
      const actionRef = gameRef.collection('actions').doc();
      transaction.set(actionRef, {
        type: 'MOVIES_REVEALED',
        at: Date.now(),
        actorId: 'SYSTEM',
        payload: { round, choices },
      });
    }
  });

  return { success: true };
});

export const roomSummary = onCall(callableOptions, async (request) => {
  const gameCode = String(request.data?.gameCode ?? '').toUpperCase();
  if (!/^[A-Z]{4}$/.test(gameCode)) {
    throw new HttpsError('invalid-argument', 'Expected a four-letter room code.');
  }

  const db = getFirestore();
  const actions = await db
    .collection('game')
    .doc(gameCode)
    .collection('actions')
    .get();

  return {
    gameCode,
    actionCount: actions.size,
  };
});
