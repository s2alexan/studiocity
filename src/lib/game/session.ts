import { createPlayerId, type PlayerId } from './actions';

const key = 'studio-city-player-id';

export function getLocalPlayerId(): PlayerId {
  const existing = localStorage.getItem(key);
  if (existing) {
    return existing;
  }

  const playerId = createPlayerId();
  localStorage.setItem(key, playerId);
  return playerId;
}
