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

export const MOVIE_DECK: MovieCard[] = [{"id":"_movie_1","type":"movie","title":"The Shawshank Pardon","boxOfficeRank":0,"reviewRank":19,"contractRank":26},{"id":"_movie_2","type":"movie","title":"The Don’s Promise","boxOfficeRank":1,"reviewRank":27,"contractRank":17},{"id":"_movie_3","type":"movie","title":"The Dark Guardian","boxOfficeRank":2,"reviewRank":14,"contractRank":29},{"id":"_movie_4","type":"movie","title":"Citizen Kline","boxOfficeRank":3,"reviewRank":22,"contractRank":20},{"id":"_movie_5","type":"movie","title":"12 Indignant Men","boxOfficeRank":4,"reviewRank":29,"contractRank":12},{"id":"_movie_6","type":"movie","title":"Schindler’s Ledger","boxOfficeRank":5,"reviewRank":30,"contractRank":10},{"id":"_movie_7","type":"movie","title":"The Prestige Clause","boxOfficeRank":6,"reviewRank":24,"contractRank":15},{"id":"_movie_8","type":"movie","title":"Pulp Stories","boxOfficeRank":7,"reviewRank":17,"contractRank":21},{"id":"_movie_9","type":"movie","title":"The Known Suspects","boxOfficeRank":8,"reviewRank":9,"contractRank":28},{"id":"_movie_10","type":"movie","title":"Back Window","boxOfficeRank":9,"reviewRank":25,"contractRank":11},{"id":"_movie_11","type":"movie","title":"Forrest’s Run","boxOfficeRank":10,"reviewRank":12,"contractRank":23},{"id":"_movie_12","type":"movie","title":"Brawl Club","boxOfficeRank":11,"reviewRank":4,"contractRank":30},{"id":"_movie_13","type":"movie","title":"Alien Visitor","boxOfficeRank":12,"reviewRank":20,"contractRank":13},{"id":"_movie_14","type":"movie","title":"Dream Ingress","boxOfficeRank":13,"reviewRank":23,"contractRank":9},{"id":"_movie_15","type":"movie","title":"Apocalypse Today","boxOfficeRank":14,"reviewRank":28,"contractRank":3},{"id":"_movie_16","type":"movie","title":"The Matrix Code","boxOfficeRank":15,"reviewRank":6,"contractRank":24},{"id":"_movie_17","type":"movie","title":"Keepsake","boxOfficeRank":16,"reviewRank":2,"contractRank":27},{"id":"_movie_18","type":"movie","title":"Seven Sins","boxOfficeRank":17,"reviewRank":3,"contractRank":25},{"id":"_movie_19","type":"movie","title":"It’s a Remarkable Existence","boxOfficeRank":18,"reviewRank":8,"contractRank":19},{"id":"_movie_20","type":"movie","title":"Seven Swordsmen","boxOfficeRank":19,"reviewRank":26,"contractRank":0},{"id":"_movie_21","type":"movie","title":"The Hush of The Goats","boxOfficeRank":20,"reviewRank":7,"contractRank":18},{"id":"_movie_22","type":"movie","title":"Saving Seargent Steven","boxOfficeRank":21,"reviewRank":18,"contractRank":6},{"id":"_movie_23","type":"movie","title":"City of Saints","boxOfficeRank":22,"reviewRank":1,"contractRank":22},{"id":"_movie_24","type":"movie","title":"Galactic Bound","boxOfficeRank":23,"reviewRank":21,"contractRank":1},{"id":"_movie_25","type":"movie","title":"Life Is Lovely","boxOfficeRank":24,"reviewRank":16,"contractRank":5},{"id":"_movie_26","type":"movie","title":"The Green Line","boxOfficeRank":25,"reviewRank":13,"contractRank":7},{"id":"_movie_27","type":"movie","title":"Eliminator 2: Reckoning Day","boxOfficeRank":26,"reviewRank":5,"contractRank":14},{"id":"_movie_28","type":"movie","title":"Amadeo","boxOfficeRank":27,"reviewRank":10,"contractRank":8},{"id":"_movie_29","type":"movie","title":"Back to Tomorrow","boxOfficeRank":28,"reviewRank":15,"contractRank":2},{"id":"_movie_30","type":"movie","title":"Psychosis","boxOfficeRank":29,"reviewRank":0,"contractRank":16},{"id":"_movie_31","type":"movie","title":"Leon the Cleaner","boxOfficeRank":30,"reviewRank":11,"contractRank":4}] as MovieCard[];

export const BOX_OFFICE_DECK: BoxOfficeCard[] = [{"id":"money_1","type":"boxOffice","bills":1},{"id":"money_2","type":"boxOffice","bills":1},{"id":"money_3","type":"boxOffice","bills":1},{"id":"money_4","type":"boxOffice","bills":1},{"id":"money_5","type":"boxOffice","bills":1},{"id":"money_6","type":"boxOffice","bills":1},{"id":"money_7","type":"boxOffice","bills":2},{"id":"money_8","type":"boxOffice","bills":2},{"id":"money_9","type":"boxOffice","bills":2},{"id":"money_10","type":"boxOffice","bills":2},{"id":"money_11","type":"boxOffice","bills":2},{"id":"money_12","type":"boxOffice","bills":2},{"id":"money_13","type":"boxOffice","bills":3},{"id":"money_14","type":"boxOffice","bills":3},{"id":"money_15","type":"boxOffice","bills":3},{"id":"money_16","type":"boxOffice","bills":3},{"id":"money_17","type":"boxOffice","bills":3},{"id":"money_18","type":"boxOffice","bills":3},{"id":"money_19","type":"boxOffice","bills":3},{"id":"money_20","type":"boxOffice","bills":4},{"id":"money_21","type":"boxOffice","bills":4},{"id":"money_22","type":"boxOffice","bills":4},{"id":"money_23","type":"boxOffice","bills":4},{"id":"money_24","type":"boxOffice","bills":4},{"id":"money_25","type":"boxOffice","bills":4}] as BoxOfficeCard[];

export const REVIEW_DECK: ReviewCard[] = [{"id":"review_1","type":"review","stars":1,"quote":"Question your relationship with anyone who likes this movie"},{"id":"review_2","type":"review","stars":1,"quote":"90 minutes of second- hand embarrassment"},{"id":"review_3","type":"review","stars":1,"quote":"No one will find it funny without illegal substances"},{"id":"review_4","type":"review","stars":1,"quote":"To call it dead and buried is an insult to soil"},{"id":"review_5","type":"review","stars":1,"quote":"To call the plot derivative is to insult a useful financial instrument"},{"id":"review_6","type":"review","stars":1,"quote":"I would rather spend the rest of my life in a cave than see this movie again"},{"id":"review_7","type":"review","stars":2,"quote":"Disagreeable in a hostile way"},{"id":"review_8","type":"review","stars":2,"quote":"Does not improve on the sight of a blank wall"},{"id":"review_9","type":"review","stars":2,"quote":"Third-worst movie of the year"},{"id":"review_10","type":"review","stars":2,"quote":"I've seen more thrilling tax reports"},{"id":"review_11","type":"review","stars":2,"quote":"A grievous experience in every category"},{"id":"review_12","type":"review","stars":2,"quote":"A painfully long lapse of taste"},{"id":"review_13","type":"review","stars":3,"quote":"Darkly comical"},{"id":"review_14","type":"review","stars":3,"quote":"The big-picture story works beautifully, but the specifics are questionable"},{"id":"review_15","type":"review","stars":3,"quote":"Not especially memorable"},{"id":"review_16","type":"review","stars":3,"quote":"An unconvincing plot"},{"id":"review_17","type":"review","stars":3,"quote":"An impressive debut"},{"id":"review_18","type":"review","stars":3,"quote":"I liked this story better when it was called 'Citizen Kane'"},{"id":"review_19","type":"review","stars":4,"quote":"This decade's Gremlins!"},{"id":"review_20","type":"review","stars":4,"quote":"Continually intelligent, funny, and shocking"},{"id":"review_21","type":"review","stars":4,"quote":"Bold and blisteringly biting"},{"id":"review_22","type":"review","stars":4,"quote":"An uncontrolled dramatic explosion"},{"id":"review_23","type":"review","stars":4,"quote":"Pacing that recalls classic Kubrick"},{"id":"review_24","type":"review","stars":4,"quote":"An engrossing experience"},{"id":"review_25","type":"review","stars":5,"quote":"Triumphant!"}] as ReviewCard[];

export const CONTRACT_DECK: ContractCard[] = [{"id":"contract_1","type":"contract","title":"WebFlix License","value":3,"conditionType":"total_stars","conditionTarget":1,"description":"<ccb>9-14</ccb> <star/>"},{"id":"contract_2","type":"contract","title":"Vinyl Limited Edition","value":4,"conditionType":"total_stars","conditionTarget":1,"description":"<ccb>10-14</ccb> <star/>"},{"id":"contract_3","type":"contract","title":"Kiosk Rental","value":4,"conditionType":"total_stars","conditionTarget":1,"description":"<ccb>11-14</ccb> <star/>"},{"id":"contract_4","type":"contract","title":"CableOne Bundle","value":4,"conditionType":"total_stars","conditionTarget":1,"description":"<ccb>12-15</ccb> <star/>"},{"id":"contract_5","type":"contract","title":"Second-Run Theatre","value":5,"conditionType":"total_stars","conditionTarget":1,"description":"<ccb>13-17</ccb> <star/>"},{"id":"contract_6","type":"contract","title":"Airline Deal","value":7,"conditionType":"total_stars","conditionTarget":1,"description":"<ccb>14-18</ccb> <star/>"},{"id":"contract_7","type":"contract","title":"Hotel Pay Per View","value":9,"conditionType":"total_stars","conditionTarget":1,"description":"<ccb>15-20</ccb> <star/>"},{"id":"contract_8","type":"contract","title":"Library Copy Fee","value":8,"conditionType":"total_bills","conditionTarget":1,"description":"More <star/>\nthan <bill/>"},{"id":"contract_9","type":"contract","title":"Classroom Kit","value":6,"conditionType":"total_stars","conditionTarget":1,"description":"More <star/>\nthan <player_to_right/>"},{"id":"contract_10","type":"contract","title":"DVD Value Pack","value":3,"conditionType":"total_bills","conditionTarget":1,"description":"<ccb>13-20</ccb> <bill/>"},{"id":"contract_11","type":"contract","title":"BluRay Steel Tin","value":3,"conditionType":"total_bills","conditionTarget":1,"description":"<ccb>14-20</ccb> <bill/>"},{"id":"contract_12","type":"contract","title":"4K Ultra Disk","value":4,"conditionType":"total_bills","conditionTarget":1,"description":"<ccb>15-20</ccb> <bill/>"},{"id":"contract_13","type":"contract","title":"Drive-In Nights","value":3,"conditionType":"total_bills","conditionTarget":1,"description":"More <bill/>\nthan <star/>"},{"id":"contract_14","type":"contract","title":"3D Re-Release","value":3,"conditionType":"total_bills","conditionTarget":1,"description":"More <bill/>\nthan <player_to_right/>"},{"id":"contract_15","type":"contract","title":"Foreign Dub Rights","value":3,"conditionType":"blockbusters","conditionTarget":1,"description":"<ccb>3-5</ccb> <blockbuster/>"},{"id":"contract_16","type":"contract","title":"Soundtrack Album","value":4,"conditionType":"loved","conditionTarget":1,"description":"<ccb>3-5</ccb> <loved/>"},{"id":"contract_17","type":"contract","title":"Novelization Deal","value":4,"conditionType":"loved","conditionTarget":1,"description":"<ccb>2-3</ccb> <loved/>"},{"id":"contract_18","type":"contract","title":"Comic Mini-Series","value":4,"conditionType":"blockbusters","conditionTarget":1,"description":"More <blockbuster/>\nthan <loved/>"},{"id":"contract_19","type":"contract","title":"AAA Console Game","value":8,"conditionType":"blockbusters","conditionTarget":1,"description":"More <loved/>\nthan <blockbuster/>"},{"id":"contract_20","type":"contract","title":"Fast Food Toys","value":9,"conditionType":"blockbusters","conditionTarget":1,"description":"<blockbuster/> = <loved/>"},{"id":"contract_21","type":"contract","title":"NFT Rug Pull","value":6,"conditionType":"loved","conditionTarget":1,"description":"More <loved/>\nthan <player_to_right/>"},{"id":"contract_22","type":"contract","title":"Mobile Gacha Game","value":3,"conditionType":"blockbusters","conditionTarget":1,"description":"More <blockbuster/>\nthan <player_to_right/>"},{"id":"contract_23","type":"contract","title":"Branded Toothbrush","value":4,"conditionType":"loved","conditionTarget":1,"description":"Same or more <loved/>\nthan <player_to_right/>"},{"id":"contract_24","type":"contract","title":"Plushies License","value":5,"conditionType":"loved","conditionTarget":1,"description":"Fewer <loved/>\nthan <player_to_right/>"},{"id":"contract_25","type":"contract","title":"BrickToy Set","value":7,"conditionType":"free","conditionTarget":0,"description":"Higher unreleased <box_office_rank_icon />\nthan <player_to_right/>"},{"id":"contract_26","type":"contract","title":"Theme Park Ride","value":7,"conditionType":"free","conditionTarget":0,"description":"Higher unreleased <review_rank_icon />\nthan <player_to_right/>"},{"id":"contract_27","type":"contract","title":"Teen Magazine Posters","value":7,"conditionType":"free","conditionTarget":0,"description":"Higher unreleased <contract_rank_icon />\nthan <player_to_right/>"}] as ContractCard[];

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
