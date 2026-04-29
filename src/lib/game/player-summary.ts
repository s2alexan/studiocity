import { getBoxOfficeCard, getContractCard, getReviewCard, type ContractCard } from './cards';
import type { PlayerState } from './reducer';

export interface PlayerSummary {
  bills: number;
  stars: number;
  loved: number;
  blockbusters: number;
  contracts: ContractCard[];
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
  return contract.description
    .replace(/<\/?ccb>/g, '')
    .replace(/<\s*([a-z_]+)\s*\/>/gi, (_match, tag: string) => {
      return conditionTagLabels[tag] ?? tag.replace(/_/g, ' ');
    })
    .replace(/\s+/g, ' ')
    .trim();
}
