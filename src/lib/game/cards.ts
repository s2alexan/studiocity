export type CardId = string;

export interface MovieCard {
  id: CardId;
  type: 'movie';
  title: string;
  boxOfficeRank: number;
  reviewRank: number;
  contractRank: number;
}

export interface BoxOfficeCard {
  id: CardId;
  type: 'boxOffice';
  bills: number;
}

export interface ReviewCard {
  id: CardId;
  type: 'review';
  stars: number;
}

export type ContractConditionType =
  | 'total_bills'
  | 'total_stars'
  | 'blockbusters'
  | 'loved'
  | 'free'; // 'free' means no condition (for testing)

export interface ContractCard {
  id: CardId;
  type: 'contract';
  value: number;
  conditionType: ContractConditionType;
  conditionTarget: number;
  description: string;
}

// Generate simple mock decks for the MVP v0.1
export const MOVIE_DECK: MovieCard[] = Array.from({ length: 31 }).map((_, i) => {
  // Simple algorithm to generate ranks summing to 45 (ranks between 0 and 30)
  const boxOfficeRank = i % 31;
  let reviewRank = (i * 7) % 31;
  let contractRank = 45 - boxOfficeRank - reviewRank;
  if (contractRank < 0) {
    reviewRank += contractRank;
    contractRank = 0;
  } else if (contractRank > 30) {
    const diff = contractRank - 30;
    contractRank -= diff;
    reviewRank += diff;
  }
  return {
    id: `m${i}`,
    type: 'movie',
    title: `Movie ${i + 1}`,
    boxOfficeRank,
    reviewRank,
    contractRank,
  };
});

export const BOX_OFFICE_DECK: BoxOfficeCard[] = Array.from({ length: 25 }).map((_, i) => ({
  id: `b${i}`,
  type: 'boxOffice',
  bills: (i % 4) + 1, // 1 to 4 bills
}));

export const REVIEW_DECK: ReviewCard[] = Array.from({ length: 25 }).map((_, i) => ({
  id: `r${i}`,
  type: 'review',
  stars: (i % 4) + 1, // 1 to 4 stars
}));

export const CONTRACT_DECK: ContractCard[] = Array.from({ length: 27 }).map((_, i) => {
  const types: ContractConditionType[] = ['total_bills', 'total_stars', 'blockbusters', 'loved'];
  const conditionType = types[i % types.length];
  const value = (i % 7) + 3; // 3 to 9
  const conditionTarget = conditionType === 'total_bills' || conditionType === 'total_stars' ? 5 : 2;
  return {
    id: `c${i}`,
    type: 'contract',
    value,
    conditionType,
    conditionTarget,
    description: `Requires ${conditionTarget} ${conditionType.replace('_', ' ')}`,
  };
});

export const CARD_DATABASE = {
  movies: Object.fromEntries(MOVIE_DECK.map((c) => [c.id, c])),
  boxOffice: Object.fromEntries(BOX_OFFICE_DECK.map((c) => [c.id, c])),
  reviews: Object.fromEntries(REVIEW_DECK.map((c) => [c.id, c])),
  contracts: Object.fromEntries(CONTRACT_DECK.map((c) => [c.id, c])),
};

export function getMovieCard(id: CardId): MovieCard {
  return CARD_DATABASE.movies[id];
}
export function getBoxOfficeCard(id: CardId): BoxOfficeCard {
  return CARD_DATABASE.boxOffice[id];
}
export function getReviewCard(id: CardId): ReviewCard {
  return CARD_DATABASE.reviews[id];
}
export function getContractCard(id: CardId): ContractCard {
  return CARD_DATABASE.contracts[id];
}
