import { createPlayerId, type PlayerId } from './actions';

const playerIdKey = 'studio-city-player-id';
const playerNameKey = 'studio-city-player-name';

export function getLocalPlayerId(): PlayerId {
  const existing = localStorage.getItem(playerIdKey);
  if (existing) {
    return existing;
  }

  const playerId = createPlayerId();
  localStorage.setItem(playerIdKey, playerId);
  return playerId;
}

export function getLocalPlayerName() {
  return localStorage.getItem(playerNameKey);
}

export function setLocalPlayerName(name: string) {
  localStorage.setItem(playerNameKey, name);
}
