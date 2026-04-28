import { httpsCallable, type Functions } from 'firebase/functions';
import type { GameCode, PlayerId } from './actions';

export async function callStartGame(
  functions: Functions,
  gameCode: GameCode,
  actorId: PlayerId,
  playerIds: PlayerId[],
) {
  const startGame = httpsCallable<{ gameCode: string; actorId: string; playerIds: string[] }, { success: boolean }>(functions, 'startGame');
  await startGame({ gameCode, actorId, playerIds });
}

export async function callSubmitMovie(
  functions: Functions,
  gameCode: GameCode,
  actorId: PlayerId,
  round: number,
  movieId: string,
) {
  const submitMovie = httpsCallable<{ gameCode: string; actorId: string; round: number; movieId: string }, { success: boolean }>(functions, 'submitMovie');
  await submitMovie({ gameCode, actorId, round, movieId });
}
