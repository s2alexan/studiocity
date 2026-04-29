import type { BoxOfficeCard, ContractCard, MovieCard, ReviewCard } from './cards';

export type StudioCityCard = MovieCard | BoxOfficeCard | ReviewCard | ContractCard;

export type CardBackType = StudioCityCard['type'];

function exportId(card: StudioCityCard) {
  return card.id.replace(/^_/, '');
}

export function cardFacePath(card: StudioCityCard) {
  if (card.type === 'boxOffice') return `/card-art/faces/money/${card.bills}.png`;
  if (card.type === 'review') return `/card-art/faces/review/${Math.min(card.stars, 4)}.png`;

  return `/card-art/faces/${exportId(card)}.png`;
}

export function cardBackPath(type: CardBackType) {
  const filename = type === 'boxOffice' ? 'box-office' : type;
  return `/card-art/backs/${filename}.png`;
}

export function cardOrientation(type: CardBackType) {
  return type === 'movie' ? 'portrait' : 'landscape';
}

export function cardAltText(card: StudioCityCard) {
  if (card.type === 'movie') return card.title;
  if (card.type === 'boxOffice') return `${card.bills} bill box office card`;
  if (card.type === 'review') return `${card.stars} star review card`;
  return `${card.title} contract`;
}
