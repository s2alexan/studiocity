import { getBoxOfficeCard, getContractCard, getReviewCard, type ContractCard } from './cards';
import type { GameProjection, PlayerState } from './reducer';

export interface PlayerSummary {
  bills: number;
  stars: number;
  loved: number;
  blockbusters: number;
  contracts: ContractCard[];
}

export type ContractStatus = 'complete' | 'failed' | 'tbd';

export interface ConditionToken {
  kind: 'text' | 'icon';
  value: string;
  bold?: boolean;
}

type Metric = 'bills' | 'stars' | 'loved' | 'blockbusters';

interface MetricRange {
  min: number;
  max: number;
}

const conditionTagLabels: Record<string, string> = {
  bill: 'bills',
  star: 'stars',
  loved: 'loved',
  blockbuster: 'blockbusters',
  player_to_right: 'player to right',
  box_office_rank_icon: 'box office rank',
  review_rank_icon: 'review rank',
  contract_rank_icon: 'contract rank',
};

export function summarizePlayerState(playerState?: PlayerState): PlayerSummary {
  const boxOffice = playerState?.boxOffice ?? [];
  const reviews = playerState?.reviews ?? [];
  const contracts = playerState?.contracts ?? [];

  return {
    bills: boxOffice.reduce((sum, id) => sum + getBoxOfficeCard(id).bills, 0),
    stars: reviews.reduce((sum, id) => sum + getReviewCard(id).stars, 0),
    loved: reviews.filter((id) => getReviewCard(id).stars >= 3).length,
    blockbusters: boxOffice.filter((id) => getBoxOfficeCard(id).bills >= 3).length,
    contracts: contracts.map((id) => getContractCard(id)),
  };
}

export function contractConditionText(contract: ContractCard) {
  return conditionTokens(contract)
    .map((token) => (token.kind === 'icon' ? conditionTagLabels[token.value] ?? token.value : token.value))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function conditionTokens(contract: ContractCard): ConditionToken[] {
  const tokens: ConditionToken[] = [];
  let bold = false;
  const pattern = /<ccb>|<\/ccb>|<\s*([a-z_]+)\s*\/>|([^<]+)/gi;

  for (const match of contract.description.matchAll(pattern)) {
    if (match[0] === '<ccb>') {
      bold = true;
      continue;
    }

    if (match[0] === '</ccb>') {
      bold = false;
      continue;
    }

    if (match[1]) {
      tokens.push({ kind: 'icon', value: match[1], bold });
      continue;
    }

    for (const word of (match[2] ?? '').replace(/\s+/g, ' ').trim().split(' ')) {
      if (word) tokens.push({ kind: 'text', value: word, bold });
    }
  }

  return tokens;
}

export function contractStatus(
  contract: ContractCard,
  projection: GameProjection,
  playerId: string,
): ContractStatus {
  const playerState = projection.playerStates[playerId];
  if (!playerState) return 'tbd';

  const summary = summarizePlayerState(playerState);
  const roundsRemaining = roundsWithAwardsRemaining(projection);
  const rightSummary = summarizePlayerState(rightNeighborState(projection, playerId));
  const text = contractConditionText(contract).toLowerCase();

  const rangeMatch = text.match(/^(\d+)-(\d+) (bills|stars|loved|blockbusters)$/);
  if (rangeMatch) {
    const lower = Number(rangeMatch[1]);
    const upper = Number(rangeMatch[2]);
    const range = metricRange(summary, rangeMatch[3] as Metric, roundsRemaining);

    if (range.max < lower || range.min > upper) return 'failed';
    if (range.min >= lower && range.max <= upper) return 'complete';
    return 'tbd';
  }

  const moreOwnMatch = text.match(/^more (bills|stars|loved|blockbusters) than (bills|stars|loved|blockbusters)$/);
  if (moreOwnMatch) {
    return compareRanges(
      metricRange(summary, moreOwnMatch[1] as Metric, roundsRemaining),
      metricRange(summary, moreOwnMatch[2] as Metric, roundsRemaining),
      '>',
    );
  }

  const moreRightMatch = text.match(/^more (bills|stars|loved|blockbusters) than player to right$/);
  if (moreRightMatch) {
    return compareRanges(
      metricRange(summary, moreRightMatch[1] as Metric, roundsRemaining),
      metricRange(rightSummary, moreRightMatch[1] as Metric, roundsRemaining),
      '>',
    );
  }

  const sameOrMoreRightMatch = text.match(/^same or more (bills|stars|loved|blockbusters) than player to right$/);
  if (sameOrMoreRightMatch) {
    return compareRanges(
      metricRange(summary, sameOrMoreRightMatch[1] as Metric, roundsRemaining),
      metricRange(rightSummary, sameOrMoreRightMatch[1] as Metric, roundsRemaining),
      '>=',
    );
  }

  const fewerRightMatch = text.match(/^fewer (bills|stars|loved|blockbusters) than player to right$/);
  if (fewerRightMatch) {
    return compareRanges(
      metricRange(summary, fewerRightMatch[1] as Metric, roundsRemaining),
      metricRange(rightSummary, fewerRightMatch[1] as Metric, roundsRemaining),
      '<',
    );
  }

  const equalityMatch = text.match(/^(bills|stars|loved|blockbusters) = (bills|stars|loved|blockbusters)$/);
  if (equalityMatch) {
    return equalityStatus(
      metricRange(summary, equalityMatch[1] as Metric, roundsRemaining),
      metricRange(summary, equalityMatch[2] as Metric, roundsRemaining),
    );
  }

  return projection.status === 'game_over' && contract.conditionType === 'free' ? 'complete' : 'tbd';
}

function roundsWithAwardsRemaining(projection: GameProjection) {
  if (projection.status === 'game_over') return 0;
  if (projection.status !== 'playing') return 5;

  return projection.phase === 'contract_auction' ? 5 - projection.round : 6 - projection.round;
}

function rightNeighborState(projection: GameProjection, playerId: string) {
  const playersBySeat = [...projection.players].sort((a, b) => a.seatIndex - b.seatIndex);
  const playerIndex = playersBySeat.findIndex((player) => player.id === playerId);
  if (playerIndex < 0 || playersBySeat.length < 2) return undefined;

  const neighbor = playersBySeat[(playerIndex + 1) % playersBySeat.length];
  return projection.playerStates[neighbor.id];
}

function metricRange(summary: PlayerSummary, metric: Metric, roundsRemaining: number): MetricRange {
  if (metric === 'bills') {
    return { min: summary.bills + roundsRemaining, max: summary.bills + roundsRemaining * 4 };
  }

  if (metric === 'stars') {
    return { min: summary.stars + roundsRemaining, max: summary.stars + roundsRemaining * 5 };
  }

  return { min: summary[metric], max: summary[metric] + roundsRemaining };
}

function compareRanges(left: MetricRange, right: MetricRange, operator: '>' | '>=' | '<'): ContractStatus {
  if (operator === '>') {
    if (left.min > right.max) return 'complete';
    if (left.max <= right.min) return 'failed';
    return 'tbd';
  }

  if (operator === '>=') {
    if (left.min >= right.max) return 'complete';
    if (left.max < right.min) return 'failed';
    return 'tbd';
  }

  if (left.max < right.min) return 'complete';
  if (left.min >= right.max) return 'failed';
  return 'tbd';
}

function equalityStatus(left: MetricRange, right: MetricRange): ContractStatus {
  if (left.min === left.max && right.min === right.max) {
    return left.min === right.min ? 'complete' : 'failed';
  }

  if (left.max < right.min || right.max < left.min) return 'failed';
  return 'tbd';
}
