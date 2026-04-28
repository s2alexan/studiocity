import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sourcePath = resolve('data/studio-city-card-data-current.csv');
const outputPath = resolve('src/lib/game/cards.ts');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((candidate) => candidate.some((value) => value.length > 0));
}

function rowObjects(text) {
  const [headers, ...rows] = parseCsv(text);
  return rows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])),
  );
}

function cardNumber(id) {
  return Number(id.match(/_(\d+)$/)?.[1] ?? 0);
}

function numericFromTemplate(value, fallback = 0) {
  return Number(value.match(/_(\d+)\.url/)?.[1] ?? fallback);
}

function classifyCondition(condition) {
  const normalized = condition.toLowerCase();

  if (normalized.includes('<blockbuster/>')) {
    return { conditionType: 'blockbusters', conditionTarget: 1 };
  }
  if (normalized.includes('<loved/>')) {
    return { conditionType: 'loved', conditionTarget: 1 };
  }
  if (normalized.includes('<bill/>')) {
    return { conditionType: 'total_bills', conditionTarget: 1 };
  }
  if (normalized.includes('<star/>')) {
    return { conditionType: 'total_stars', conditionTarget: 1 };
  }

  return { conditionType: 'free', conditionTarget: 0 };
}

function toSource(value) {
  return JSON.stringify(value);
}

const rows = rowObjects(readFileSync(sourcePath, 'utf8'));
const movies = rows
  .filter((row) => row.name.startsWith('_movie_'))
  .sort((a, b) => cardNumber(a.name) - cardNumber(b.name))
  .map((row) => ({
    id: row.name,
    type: 'movie',
    title: row.movie_name,
    boxOfficeRank: Number(row.box_office),
    reviewRank: Number(row.reviews),
    contractRank: Number(row.contracts),
  }));

const boxOffice = rows
  .filter((row) => row.name.startsWith('money_'))
  .sort((a, b) => cardNumber(a.name) - cardNumber(b.name))
  .map((row) => ({
    id: row.name,
    type: 'boxOffice',
    bills: numericFromTemplate(row.background, 1),
  }));

const reviews = rows
  .filter((row) => row.name.startsWith('review_'))
  .sort((a, b) => cardNumber(a.name) - cardNumber(b.name))
  .map((row) => ({
    id: row.name,
    type: 'review',
    stars: numericFromTemplate(row.stars, 1),
    quote: row.critic_review_quote,
  }));

const contracts = rows
  .filter((row) => row.name.startsWith('contract_'))
  .sort((a, b) => cardNumber(a.name) - cardNumber(b.name))
  .map((row) => ({
    id: row.name,
    type: 'contract',
    title: row.contract_title,
    value: Number(row.contract_reward),
    ...classifyCondition(row.contract_condition),
    description: row.contract_condition,
  }));

const output = `export type CardId = string;

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
  quote: string;
}

export type ContractConditionType =
  | 'total_bills'
  | 'total_stars'
  | 'blockbusters'
  | 'loved'
  | 'free';

export interface ContractCard {
  id: CardId;
  type: 'contract';
  title: string;
  value: number;
  conditionType: ContractConditionType;
  conditionTarget: number;
  description: string;
}

export const MOVIE_DECK: MovieCard[] = ${toSource(movies)} as MovieCard[];

export const BOX_OFFICE_DECK: BoxOfficeCard[] = ${toSource(boxOffice)} as BoxOfficeCard[];

export const REVIEW_DECK: ReviewCard[] = ${toSource(reviews)} as ReviewCard[];

export const CONTRACT_DECK: ContractCard[] = ${toSource(contracts)} as ContractCard[];

export const CARD_DATABASE = {
  movies: Object.fromEntries(MOVIE_DECK.map((card) => [card.id, card])),
  boxOffice: Object.fromEntries(BOX_OFFICE_DECK.map((card) => [card.id, card])),
  reviews: Object.fromEntries(REVIEW_DECK.map((card) => [card.id, card])),
  contracts: Object.fromEntries(CONTRACT_DECK.map((card) => [card.id, card])),
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
`;

writeFileSync(outputPath, output);
