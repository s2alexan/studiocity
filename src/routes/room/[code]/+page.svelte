<script lang="ts">
  import { base } from '$app/paths';
  import { onDestroy, onMount } from 'svelte';
  import CardImage from '$lib/components/CardImage.svelte';
  import { getFirebaseServices } from '$lib/firebase/config';
  import { GAME_ANIMATION_SPEED_MS } from '$lib/game/animation';
  import { isGameCode, type PlayerId } from '$lib/game/actions';
  import { cardBackPath, type CardBackType } from '$lib/game/card-art';
  import { getBoxOfficeCard, getContractCard, getMovieCard, getReviewCard } from '$lib/game/cards';
  import { claimSeat, chooseContract, joinRoom, listenToActions, listenToPrivateData, openSummary } from '$lib/game/firestore';
  import { callStartGame, callSubmitMovie } from '$lib/game/functions';
  import {
    conditionTokens,
    contractStatus,
    summarizePlayerState,
    type ContractStatus,
  } from '$lib/game/player-summary';
  import { replayActions, setLocalPlayerId, type GameProjection } from '$lib/game/reducer';
  import { getLocalPlayerId } from '$lib/game/session';
  import { store } from '$lib/game/store';

  const { data } = $props<{ data: { code: string } }>();
  const DECK_LAYER_COUNT = 10;
  const MOVIE_SELECTION_SETTLE_MS = GAME_ANIMATION_SPEED_MS * 1.05;
  const MOVIE_REVEAL_MS = GAME_ANIMATION_SPEED_MS * 1.6;

  let name = $state('Player');
  let status = $state('Connecting');
  let error = $state('');
  
  let projection = $state(store.getState().game.projection);
  let localPlayerId = $state<PlayerId | null>(null);
  let privateData = $state<{ hand: string[]; chosenMovie: string | null } | null>(null);
  let busy = $state(false);
  let animationsDisabled = $state(false);
  let contractAwardKey = $state('');
  let pendingSelectedMovieId = $state<string | null>(null);
  let stagedTableProjection = $state<GameProjection | null>(null);
  let stagedPlayedMovies = $state<Record<PlayerId, string>>({});
  let movieRevealStage = $state<'idle' | 'settling' | 'revealing'>('idle');
  let movieRevealTimers: number[] = [];

  const unsubscribeStore = store.subscribe(() => {
    const nextProjection = store.getState().game.projection;
    if (
      !animationsDisabled &&
      nextProjection.lastActionType === 'MOVIES_REVEALED' &&
      projection.lastActionType !== 'MOVIES_REVEALED' &&
      projection.gameCode === nextProjection.gameCode &&
      projection.status === 'playing' &&
      projection.players.length === nextProjection.players.length
    ) {
      stageMovieReveal(projection, nextProjection);
    }

    projection = nextProjection;
    localPlayerId = store.getState().game.localPlayerId;
  });

  onMount(() => {
    animationsDisabled =
      window.localStorage.getItem('studioCity:disableAnimations') === '1' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isGameCode(data.code)) {
      error = 'Invalid room code.';
      status = 'Error';
      return;
    }

    const playerId = getLocalPlayerId();
    store.dispatch(setLocalPlayerId(playerId));
    
    const { db } = getFirebaseServices();
    
    const unsubscribeActions = listenToActions(
      db,
      data.code,
      (actions) => {
        store.dispatch(replayActions(actions));
        status = 'Live';
      },
      (caught) => {
        error = caught.message;
        status = 'Error';
      },
    );

    const unsubscribePrivate = listenToPrivateData(
      db,
      data.code,
      playerId,
      (data) => {
        privateData = data;
      },
      (caught) => {
        error = `Could not load your hand: ${caught.message}`;
      },
    );

    onDestroy(() => {
      unsubscribeActions();
      unsubscribePrivate();
    });
  });

  onDestroy(unsubscribeStore);
  onDestroy(clearMovieRevealTimers);

  $effect(() => {
    if (localPlayerId && projection.playedMovies[localPlayerId]) {
      pendingSelectedMovieId = null;
    }
  });

  function clearMovieRevealTimers() {
    movieRevealTimers.forEach((timer) => window.clearTimeout(timer));
    movieRevealTimers = [];
  }

  function stageMovieReveal(beforeReveal: GameProjection, afterReveal: GameProjection) {
    clearMovieRevealTimers();
    stagedTableProjection = structuredClone(beforeReveal);
    stagedTableProjection.playedMovies = {};
    stagedTableProjection.selectedMoviePlayers = Object.fromEntries(
      Object.keys(afterReveal.playedMovies).map((playerId) => [playerId, true]),
    );
    stagedPlayedMovies = { ...afterReveal.playedMovies };
    movieRevealStage = 'settling';

    movieRevealTimers = [
      window.setTimeout(() => {
        movieRevealStage = 'revealing';
      }, MOVIE_SELECTION_SETTLE_MS),
      window.setTimeout(() => {
        stagedTableProjection = null;
        stagedPlayedMovies = {};
        movieRevealStage = 'idle';
      }, MOVIE_SELECTION_SETTLE_MS + MOVIE_REVEAL_MS),
    ];
  }

  const tableProjection = $derived(stagedTableProjection ?? projection);

  async function join() {
    if (!isGameCode(data.code)) return;
    error = '';
    busy = true;
    try {
      const { db } = getFirebaseServices();
      await joinRoom(db, data.code, getLocalPlayerId(), name.trim() || 'Player');
    } catch (caught) {
      error = caught instanceof Error ? caught.message : 'Could not join room.';
    } finally {
      busy = false;
    }
  }

  async function handleClaimSeat() {
    if (!isGameCode(data.code)) return;
    try {
      const { db } = getFirebaseServices();
      await claimSeat(db, data.code, getLocalPlayerId(), projection.players.length);
    } catch (caught) {
      error = caught instanceof Error ? caught.message : 'Could not claim seat.';
    }
  }

  async function handleStartGame() {
    if (!isGameCode(data.code)) return;
    busy = true;
    try {
      const { functions } = getFirebaseServices();
      const playerIds = projection.players.map((p) => p.id);
      await callStartGame(functions, data.code, getLocalPlayerId(), playerIds);
    } catch (caught) {
      error = caught instanceof Error ? caught.message : 'Could not start game.';
    } finally {
      busy = false;
    }
  }

  async function handlePlayMovie(movieId: string) {
    if (!isGameCode(data.code) || busy) return;
    pendingSelectedMovieId = movieId;
    error = '';
    busy = true;
    try {
      const { functions } = getFirebaseServices();
      await callSubmitMovie(functions, data.code, getLocalPlayerId(), projection.round, movieId);
    } catch (caught) {
      pendingSelectedMovieId = null;
      error = caught instanceof Error ? caught.message : 'Could not submit movie.';
    } finally {
      busy = false;
    }
  }

  async function handleChooseContract(contractId: string) {
    if (!isGameCode(data.code)) return;
    if (projection.contractPickOrder[0] !== getLocalPlayerId()) {
      error = "It's not your turn to pick a contract yet.";
      return;
    }
    error = '';
    try {
      const { db } = getFirebaseServices();
      const latestActionAt = store.getState().game.actions.at(-1)?.at ?? Date.now();
      await chooseContract(db, data.code, getLocalPlayerId(), projection.round, contractId, latestActionAt);
    } catch (caught) {
      error = caught instanceof Error ? caught.message : 'Could not choose contract.';
    }
  }

  async function handleOpenSummary() {
    if (!isGameCode(data.code) || projection.status !== 'final_round_complete') return;
    error = '';
    try {
      const { db } = getFirebaseServices();
      const latestActionAt = store.getState().game.actions.at(-1)?.at ?? Date.now();
      await openSummary(db, data.code, getLocalPlayerId(), latestActionAt);
    } catch (caught) {
      error = caught instanceof Error ? caught.message : 'Could not open summary.';
    }
  }

  function assetPath(path: string) {
    return `${base}${path}`;
  }

  function deckBackSrc(type: CardBackType) {
    return assetPath(cardBackPath(type));
  }

  function deckBackAlt(type: CardBackType) {
    if (type === 'boxOffice') return 'Box office deck';
    if (type === 'review') return 'Review deck';
    if (type === 'contract') return 'Contract deck';
    return 'Movie deck';
  }

  function statusText() {
    if (status === 'Connecting') return 'Connecting to room';
    if (tableProjection.status === 'lobby') return 'Waiting for players to join';
    if (tableProjection.status === 'final_round_complete') return 'Game complete - click here for summary';
    if (tableProjection.status === 'game_over') return 'Final scores';
    if (movieRevealStage === 'settling') return 'Revealing selected movie cards';
    if (movieRevealStage === 'revealing') return 'Movie cards revealed';
    if (tableProjection.phase === 'selection') {
      return privateData?.chosenMovie
        ? 'Waiting for players to play movie cards'
        : 'Waiting for players to play movie cards';
    }
    if (tableProjection.phase === 'contract_auction') {
      if (tableProjection.contractPickOrder[0] === localPlayerId) return 'Your turn to pick a contract';
      const picker = tableProjection.players.find((p) => p.id === tableProjection.contractPickOrder[0]);
      return `Waiting for ${picker?.name ?? 'another player'} to pick a contract`;
    }
    return 'Live';
  }

  function iconSrc(iconName: string) {
    return assetPath(`/ui/icons/${iconName}.png`);
  }

  function contractStatusLabel(status: ContractStatus) {
    if (status === 'complete') return 'definitely complete';
    if (status === 'failed') return 'definitely failed';
    return 'still possible';
  }

  function statusIcon(status: ContractStatus) {
    if (status === 'complete') return '✓';
    if (status === 'failed') return '×';
    return '?';
  }

  function latestContractAward(playerId: PlayerId, contractId: string) {
    const latestAction = store.getState().game.actions.at(-1);
    return latestAction?.type === 'CONTRACT_CHOSEN' && latestAction.actorId === playerId && latestAction.payload.contractId === contractId
      ? contractAwardKey
      : '';
  }

  function playerBillScore(playerId: PlayerId) {
    return (tableProjection.playerStates[playerId]?.boxOffice ?? []).reduce(
      (total, cardId) => total + getBoxOfficeCard(cardId).bills,
      0,
    );
  }

  function maxContractCount() {
    return Math.max(0, ...tableProjection.players.map((player) => tableProjection.playerStates[player.id]?.contracts.length ?? 0));
  }

  function contractForPlayerAt(playerId: PlayerId, index: number) {
    const contractId = tableProjection.playerStates[playerId]?.contracts[index];
    return contractId ? getContractCard(contractId) : null;
  }

  function winningScore() {
    return Math.max(0, ...tableProjection.players.map((player) => tableProjection.playerStates[player.id]?.score ?? 0));
  }

  function selectedMovieFor(playerId: PlayerId) {
    if (movieRevealStage === 'revealing' && stagedPlayedMovies[playerId]) return stagedPlayedMovies[playerId];
    if (tableProjection.playedMovies[playerId]) return tableProjection.playedMovies[playerId];
    if (playerId === localPlayerId) return privateData?.chosenMovie ?? pendingSelectedMovieId;
    return null;
  }

  function playerHasSelectedMovie(playerId: PlayerId) {
    return Boolean(
      tableProjection.playedMovies[playerId] ||
      stagedPlayedMovies[playerId] ||
      tableProjection.selectedMoviePlayers[playerId] ||
      (playerId === localPlayerId && (privateData?.chosenMovie || pendingSelectedMovieId)),
    );
  }

  function deckLayerStyle(index: number) {
    return `--deck-offset: ${index}`;
  }

  const localPlayerHasSelected = $derived(Boolean(localPlayerId && playerHasSelectedMovie(localPlayerId)));
  const showPlayedMovies = $derived(
    localPlayerHasSelected ||
      Object.keys(tableProjection.playedMovies).length > 0 ||
      Object.keys(stagedPlayedMovies).length > 0 ||
      tableProjection.phase === 'contract_auction' ||
      tableProjection.status === 'final_round_complete',
  );
  const showHand = $derived(tableProjection.status === 'playing' && tableProjection.phase === 'selection' && !privateData?.chosenMovie && !pendingSelectedMovieId && movieRevealStage === 'idle');
  const isJoined = $derived(tableProjection.players.some((p) => p.id === localPlayerId));
  const isHost = $derived(tableProjection.players[0]?.id === localPlayerId);
  const canPlayCards = $derived(projection.status === 'playing' && projection.phase === 'selection' && !privateData?.chosenMovie && !busy && movieRevealStage === 'idle');
</script>

<main
  class="game-board"
  class:animations-disabled={animationsDisabled}
  style={`--cinema-bg: url('${assetPath('/ui/cinema-background.png')}'); --animation-speed: ${animationsDisabled ? 1 : GAME_ANIMATION_SPEED_MS}ms;`}
>
  <header class="cinema-header">
    <img class="title-logo" src={assetPath('/ui/studio-city-title.png')} alt="Studio City" />
    <div class="status-strip" aria-live="polite">
      <span>{tableProjection.status === 'playing' || tableProjection.status === 'final_round_complete' ? `Round ${tableProjection.round} of 5` : `Room ${data.code}`}</span>
      {#if tableProjection.status === 'final_round_complete'}
        <button class="summary-link" type="button" onclick={handleOpenSummary}>{statusText()}</button>
      {:else}
        <span>{statusText()}</span>
      {/if}
    </div>
  </header>

  {#if error}
    <div class="error-banner" role="alert">{error}</div>
  {/if}

  {#if !isJoined}
    <div class="join-panel glass">
      <h1>Join Studio City</h1>
      <p>Room: <span class="badge">{data.code}</span></p>
      <input bind:value={name} aria-label="Player name" placeholder="Your Name" />
      <button class="btn primary" disabled={busy} onclick={join}>Join Game</button>
    </div>
  {:else if tableProjection.status === 'lobby'}
    <div class="lobby-panel glass">
      <h1>Lobby: {data.code}</h1>
      <div class="players-list">
        <h2>Players ({tableProjection.players.length})</h2>
        <ul>
          {#each tableProjection.players as player}
            <li>{player.name} {player.id === localPlayerId ? '(You)' : ''}</li>
          {/each}
        </ul>
      </div>
      <div class="lobby-actions">
        {#if isHost && tableProjection.players.length >= 2}
          <button class="btn success" disabled={busy} onclick={handleStartGame}>Start Game</button>
        {/if}
        <button class="btn secondary" onclick={handleClaimSeat}>Claim Seat</button>
      </div>
    </div>
  {:else if tableProjection.status === 'game_over'}
    <div class="game-over-panel glass">
      <h1>Game Summary</h1>
      <div class="summary-table-wrap">
        <table class="summary-table">
          <thead>
            <tr>
              <th scope="col">Score</th>
              {#each tableProjection.players as player}
                <th
                  scope="col"
                  class:winner-column={(tableProjection.playerStates[player.id]?.score ?? 0) === winningScore()}
                >
                  {player.name}
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Bills</th>
              {#each tableProjection.players as player}
                <td class:winner-column={(tableProjection.playerStates[player.id]?.score ?? 0) === winningScore()}>
                  <strong class="bill-score">{playerBillScore(player.id)}</strong>
                </td>
              {/each}
            </tr>
            {#each Array(maxContractCount()) as _, contractIndex}
              <tr>
                <th scope="row">Contract {contractIndex + 1}</th>
                {#each tableProjection.players as player}
                  {@const contract = contractForPlayerAt(player.id, contractIndex)}
                  <td class:winner-column={(tableProjection.playerStates[player.id]?.score ?? 0) === winningScore()}>
                    {#if contract}
                      {@const status = contractStatus(contract, tableProjection, player.id)}
                      <div class="contract-row-summary final-contract {status}">
                        <span
                          class="contract-state-icon"
                          aria-label={`${contract.title} is ${contractStatusLabel(status)}`}
                        >
                          {statusIcon(status)}
                        </span>
                        <strong class="contract-value">{contract.value}:&nbsp;</strong>
                        <span class="contract-condition">
                          {#each conditionTokens(contract) as token}
                            {#if token.kind === 'icon'}
                              <img
                                class="condition-icon"
                                class:light-icon={token.value === 'player_to_right'}
                                src={iconSrc(token.value)}
                                alt={token.value.replaceAll('_', ' ')}
                              />
                            {:else if token.bold}
                              <strong>{token.value}</strong>
                            {:else}
                              <span>{token.value}</span>
                            {/if}
                          {/each}
                        </span>
                      </div>
                    {:else}
                      <span class="empty-contracts">-</span>
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              {#each tableProjection.players as player}
                <td class:winner-column={(tableProjection.playerStates[player.id]?.score ?? 0) === winningScore()}>
                  <strong class="final-score">{tableProjection.playerStates[player.id]?.score ?? 0}</strong>
                </td>
              {/each}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  {:else}
    <div class="playing-state">
      <section class="market-area" aria-label="Market">
        <div class="market-row box-office-row">
          <div class="deck-stack">
            {#each Array(DECK_LAYER_COUNT) as _, layerIndex}
              <img
                class="deck-card"
                style={deckLayerStyle(layerIndex)}
                src={deckBackSrc('boxOffice')}
                alt={layerIndex === DECK_LAYER_COUNT - 1 ? deckBackAlt('boxOffice') : ''}
                aria-hidden={layerIndex === DECK_LAYER_COUNT - 1 ? undefined : 'true'}
              />
            {/each}
          </div>
          <div class="market-cards">
            {#each tableProjection.market.boxOffice as cId}
              {@const c = getBoxOfficeCard(cId)}
              <div
                class="card box-office dealt-card"
                style={`--deal-index: ${tableProjection.market.boxOffice.indexOf(cId)}; --deal-back: url('${deckBackSrc('boxOffice')}')`}
                aria-label={`${c.bills} bill box office card`}
              >
                <CardImage card={c} />
              </div>
            {/each}
          </div>
        </div>

        <div class="market-row review-row">
          <div class="deck-stack">
            {#each Array(DECK_LAYER_COUNT) as _, layerIndex}
              <img
                class="deck-card"
                style={deckLayerStyle(layerIndex)}
                src={deckBackSrc('review')}
                alt={layerIndex === DECK_LAYER_COUNT - 1 ? deckBackAlt('review') : ''}
                aria-hidden={layerIndex === DECK_LAYER_COUNT - 1 ? undefined : 'true'}
              />
            {/each}
          </div>
          <div class="market-cards">
            {#each tableProjection.market.reviews as cId}
              {@const c = getReviewCard(cId)}
              <div
                class="card review dealt-card"
                style={`--deal-index: ${tableProjection.market.reviews.indexOf(cId)}; --deal-back: url('${deckBackSrc('review')}')`}
                aria-label={`${c.stars} star review card`}
              >
                <CardImage card={c} />
              </div>
            {/each}
          </div>
        </div>

        <div class="market-row contract-row">
          <div class="deck-stack">
            {#each Array(DECK_LAYER_COUNT) as _, layerIndex}
              <img
                class="deck-card"
                style={deckLayerStyle(layerIndex)}
                src={deckBackSrc('contract')}
                alt={layerIndex === DECK_LAYER_COUNT - 1 ? deckBackAlt('contract') : ''}
                aria-hidden={layerIndex === DECK_LAYER_COUNT - 1 ? undefined : 'true'}
              />
            {/each}
          </div>
          <div class="market-cards">
            {#each tableProjection.market.contracts as cId}
              {@const c = getContractCard(cId)}
              {@const canPick = tableProjection.status === 'playing' && tableProjection.phase === 'contract_auction' && tableProjection.contractPickOrder[0] === localPlayerId}
              <button
                type="button"
                class="card contract dealt-card {canPick ? 'pickable' : ''}"
                style={`--deal-index: ${tableProjection.market.contracts.indexOf(cId)}; --deal-back: url('${deckBackSrc('contract')}')`}
                disabled={!canPick}
                aria-label={canPick ? `Choose ${c.title}` : `${c.title} is not available until your contract turn`}
                onclick={() => handleChooseContract(cId)}
              >
                <CardImage card={c} />
                <span class="sr-only">{c.title}</span>
                <span class="sr-only value">{c.value} pts</span>
                <span class="sr-only desc">{c.description}</span>
              </button>
            {/each}
          </div>
        </div>
      </section>

      <section class="player-boards" aria-label="Player summaries">
        {#each tableProjection.players as player}
          {@const pState = tableProjection.playerStates[player.id]}
          {@const summary = summarizePlayerState(pState)}
          <article class="board {player.id === localPlayerId ? 'my-board' : ''}">
            <div class="board-heading">
              <h2>{player.name}</h2>
              {#if player.id === localPlayerId}
                <span>You</span>
              {/if}
            </div>
            <div class="stats">
              <span class="stat" aria-label={`${summary.bills} bills`}>
                <img src={assetPath('/ui/icons/bill.png')} alt="" />
                <span>{summary.bills}</span>
              </span>
              <span class="stat" aria-label={`${summary.stars} stars`}>
                <img src={assetPath('/ui/icons/star.png')} alt="" />
                <span>{summary.stars}</span>
              </span>
              <span class="stat" aria-label={`${summary.loved} loved movies`}>
                <img src={assetPath('/ui/icons/loved.png')} alt="" />
                <span>{summary.loved}</span>
              </span>
              <span class="stat" aria-label={`${summary.blockbusters} blockbusters`}>
                <img src={assetPath('/ui/icons/blockbuster.png')} alt="" />
                <span>{summary.blockbusters}</span>
              </span>
            </div>
            <ul class="contract-list" aria-label={`${player.name} contracts`}>
              {#if summary.contracts.length}
                {#each summary.contracts as contract}
                  {@const status = contractStatus(contract, tableProjection, player.id)}
                  <li
                    class="contract-row-summary {status}"
                    class:contract-received={latestContractAward(player.id, contract.id)}
                  >
                    <span
                      class="contract-state-icon"
                      aria-label={`${contract.title} is ${contractStatusLabel(status)}`}
                    >
                      {statusIcon(status)}
                    </span>
                    <strong class="contract-value">{contract.value}:&nbsp;</strong>
                    <span class="contract-condition">
                      {#each conditionTokens(contract) as token}
                        {#if token.kind === 'icon'}
                          <img
                            class="condition-icon"
                            class:light-icon={token.value === 'player_to_right'}
                            src={iconSrc(token.value)}
                            alt={token.value.replaceAll('_', ' ')}
                          />
                        {:else if token.bold}
                          <strong>{token.value}</strong>
                        {:else}
                          <span>{token.value}</span>
                        {/if}
                      {/each}
                    </span>
                  </li>
                {/each}
              {:else}
                <li class="empty-contracts">No contracts</li>
              {/if}
            </ul>
          </article>
        {/each}
      </section>

      {#if showPlayedMovies}
        <section class="played-movies" aria-label="Played movie cards">
          {#each tableProjection.players as player}
            {@const revealedMovieId = tableProjection.playedMovies[player.id]}
            {@const selectedMovieId = selectedMovieFor(player.id)}
            {@const visibleMovieId = movieRevealStage === 'revealing' ? selectedMovieId : revealedMovieId}
            <div
              class="played-movie-slot"
              class:active-player={tableProjection.contractPickOrder[0] === player.id}
            >
              {#if visibleMovieId}
                {@const movie = getMovieCard(visibleMovieId)}
                <div class="card movie played-movie-card revealed">
                  <div class="flip-card">
                    <div class="flip-face flip-back">
                      <CardImage card={movie} faceUp={false} />
                    </div>
                    <div class="flip-face flip-front">
                      <CardImage card={movie} />
                    </div>
                  </div>
                </div>
              {:else if selectedMovieId || playerHasSelectedMovie(player.id)}
                <div class="card movie played-movie-card face-down selected-back">
                  <img class="card-art portrait" src={deckBackSrc('movie')} alt="Unrevealed movie card" />
                </div>
              {/if}
            </div>
          {/each}
        </section>
      {/if}

      {#if showHand}
        <section class="hand-area" aria-label="Your hand">
        <h2>Your Hand</h2>

        {#if privateData?.hand?.length}
          <div class="hand-cards">
            {#each privateData.hand as movieId}
              {@const m = getMovieCard(movieId)}
              {#if m}
                <button
                  type="button"
                  class="card movie playable"
                  disabled={!canPlayCards}
                  aria-label={`Play ${m.title}`}
                  onclick={() => canPlayCards && handlePlayMovie(movieId)}
                >
                  <CardImage card={m} />
                  <span class="sr-only">{m.title}</span>
                  <span class="sr-only ranks">
                    <span class="r-bo">Box office rank {m.boxOfficeRank}</span>
                    <span class="r-rev">Review rank {m.reviewRank}</span>
                    <span class="r-con">Contract rank {m.contractRank}</span>
                  </span>
                </button>
              {:else}
                <div class="card movie">
                  <strong>Unknown movie</strong>
                  <span>{movieId}</span>
                </div>
              {/if}
            {/each}
          </div>
        {:else}
          <div class="waiting-message">
            {privateData ? 'Your hand is empty.' : 'Waiting for your hand to be dealt...'}
          </div>
        {/if}
      </section>
      {/if}
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background-color: #0d0b0b;
    color: #f7efe2;
  }

  :global(*) {
    box-sizing: border-box;
  }

  .game-board {
    --market-card-width: clamp(80px, 8.5vw, 108px);
    --movie-card-width: clamp(82px, 8.6vw, 108px);
    --table-width: min(100%, calc((var(--market-card-width) * 7) + (0.5rem * 5) + 2.26rem));
    position: relative;
    min-height: 100vh;
    padding: 0.45rem clamp(1rem, 3vw, 2rem) 0.9rem;
    isolation: isolate;
  }

  .game-board::before {
    position: fixed;
    inset: 0;
    z-index: -2;
    content: '';
    background-image: linear-gradient(rgba(6, 5, 5, 0.2), rgba(6, 5, 5, 0.4)), var(--cinema-bg);
    background-size: cover;
    background-position: center;
  }

  .game-board::after {
    position: fixed;
    inset: 0;
    z-index: -1;
    content: '';
    pointer-events: none;
    background:
      radial-gradient(circle at 50% 12%, rgba(228, 179, 101, 0.16), transparent 30rem),
      linear-gradient(180deg, rgba(7, 6, 6, 0.06), rgba(7, 6, 6, 0.38));
  }

  .cinema-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    max-width: 1280px;
    margin: 0 auto 0.55rem;
  }

  .title-logo {
    display: block;
    width: min(34rem, 72vw);
    max-height: 6.4rem;
    height: auto;
    margin-top: -1rem;
    object-fit: contain;
    filter: drop-shadow(0 0.7rem 0.9rem rgba(0, 0, 0, 0.58));
  }

  .status-strip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.9rem;
    max-width: min(100%, 56rem);
    padding: 0.42rem 1rem;
    border: 1px solid rgba(244, 214, 158, 0.2);
    border-radius: 999px;
    background: rgba(18, 16, 14, 0.78);
    box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.22);
    color: #f9e7c7;
    font-size: clamp(0.82rem, 1.3vw, 0.98rem);
    font-weight: 700;
    letter-spacing: 0.02em;
    text-align: center;
  }

  .status-strip span + span {
    color: #f6f0e5;
    font-weight: 600;
  }

  .summary-link {
    padding: 0;
    border: 0;
    background: transparent;
    color: #f8d47f;
    font: inherit;
    font-weight: 900;
    text-decoration: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 0.18rem;
    cursor: pointer;
  }

  .summary-link:hover,
  .summary-link:focus-visible {
    color: #fff4cf;
  }

  .playing-state {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.52rem;
    width: var(--table-width);
    max-width: 100%;
    margin: 0 auto;
  }

  .glass,
  .market-area,
  .board,
  .hand-area {
    border: 1px solid rgba(244, 214, 158, 0.13);
    border-radius: 8px;
    background: rgba(13, 13, 12, 0.7);
    box-shadow: 0 1.15rem 2.25rem rgba(0, 0, 0, 0.28);
    backdrop-filter: blur(10px);
  }

  .market-area {
    display: flex;
    width: var(--table-width);
    max-width: 100%;
    flex-direction: column;
    gap: 0.32rem;
    padding: 0.5rem;
  }

  .market-row {
    display: flex;
    align-items: center;
    gap: 0.58rem;
    min-width: 0;
    padding: 0.26rem 0.34rem;
    border-radius: 8px;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01));
  }

  .market-cards,
  .hand-cards {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .deck-stack {
    position: relative;
    flex: 0 0 auto;
    width: var(--market-card-width);
    aspect-ratio: 7 / 5;
    transform-style: preserve-3d;
    overflow: visible;
  }

  .deck-card {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    transform:
      translate(
        calc(var(--deck-offset) * -0.055rem),
        calc(var(--deck-offset) * -0.045rem)
      );
    z-index: calc(var(--deck-offset) + 1);
    filter: drop-shadow(0 0.42rem 0.42rem rgba(0, 0, 0, 0.34));
  }

  .card {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: center;
    transition:
      transform calc(var(--animation-speed) * 0.18) ease,
      filter calc(var(--animation-speed) * 0.18) ease,
      outline-color calc(var(--animation-speed) * 0.18) ease,
      opacity calc(var(--animation-speed) * 0.18) ease;
  }

  .card:disabled {
    cursor: default;
    opacity: 0.72;
  }

  .card.box-office,
  .card.review,
  .card.contract {
    width: var(--market-card-width);
    aspect-ratio: 7 / 5;
  }

  .card.movie {
    width: var(--movie-card-width);
    aspect-ratio: 5 / 7;
  }

  :global(.card-art) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 0.7rem 0.85rem rgba(0, 0, 0, 0.42));
  }

  .playable:not(:disabled):hover,
  .pickable:hover {
    cursor: pointer;
    transform: translateY(-0.45rem);
    filter: brightness(1.05);
  }

  .pickable {
    outline: 3px solid rgba(112, 178, 229, 0.94);
    outline-offset: 4px;
    animation: pulse calc(var(--animation-speed) * 2.4) infinite;
  }

  .dealt-card {
    position: relative;
    overflow: hidden;
    animation: deal-from-deck calc(var(--animation-speed) * 1.64) cubic-bezier(0.2, 0.78, 0.22, 1) backwards;
    animation-delay: calc(var(--deal-index, 0) * var(--animation-speed) * 0.16);
    transform-origin: center;
    transform-style: preserve-3d;
  }

  .dealt-card :global(.card-art) {
    position: relative;
    z-index: 1;
    backface-visibility: hidden;
    animation: deal-card-front calc(var(--animation-speed) * 1.64) cubic-bezier(0.2, 0.78, 0.22, 1) backwards;
    animation-delay: calc(var(--deal-index, 0) * var(--animation-speed) * 0.16);
  }

  .dealt-card::before {
    position: absolute;
    inset: 0;
    z-index: 2;
    content: '';
    border-radius: 8px;
    background-image: var(--deal-back);
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    backface-visibility: hidden;
    opacity: 0;
    pointer-events: none;
    transform: rotateY(-180deg);
    animation: deal-card-back calc(var(--animation-speed) * 1.64) cubic-bezier(0.2, 0.78, 0.22, 1) backwards;
    animation-delay: calc(var(--deal-index, 0) * var(--animation-speed) * 0.16);
  }

  .played-movie-slot.active-player .played-movie-card {
    z-index: 2;
    outline: 3px solid rgba(246, 212, 127, 0.9);
    outline-offset: 4px;
    animation: selected-glow calc(var(--animation-speed) * 1.4) ease-in-out infinite;
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(112, 178, 229, 0.32); }
    70% { box-shadow: 0 0 0 12px rgba(112, 178, 229, 0); }
    100% { box-shadow: 0 0 0 0 rgba(112, 178, 229, 0); }
  }

  @keyframes deal-from-deck {
    0% {
      opacity: 1;
      transform:
        translateX(calc(-1 * ((var(--deal-index, 0) + 1) * (var(--market-card-width) + 0.5rem) + 0.58rem)))
        translateY(calc(-0.4rem - (9 * 0.045rem)))
        scale(0.98);
      filter: brightness(0.96);
    }
    55% {
      opacity: 1;
      transform: translateX(0.08rem) translateY(-0.04rem) scale(1.015);
    }
    100% {
      transform: translateX(0) translateY(0) scale(1);
      filter: brightness(1);
    }
  }

  @keyframes deal-card-front {
    0%, 44% {
      transform: rotateY(180deg);
    }
    55% {
      transform: rotateY(90deg);
    }
    100% {
      transform: rotateY(0deg);
    }
  }

  @keyframes deal-card-back {
    0%, 44% {
      opacity: 1;
      transform: rotateY(0deg);
    }
    55% {
      opacity: 0;
      transform: rotateY(-90deg);
    }
    100% {
      opacity: 0;
      transform: rotateY(-180deg);
    }
  }

  @keyframes selected-glow {
    0%, 100% {
      filter: brightness(1);
      box-shadow:
        0 0 0 0 rgba(246, 212, 127, 0.3),
        0 0 0.4rem rgba(246, 212, 127, 0.34);
    }
    50% {
      filter: brightness(1.12);
      box-shadow:
        0 0 0 0.48rem rgba(246, 212, 127, 0),
        0 0 0.9rem rgba(246, 212, 127, 0.74);
    }
  }

  .player-boards {
    display: flex;
    width: var(--table-width);
    max-width: 100%;
    gap: 0.58rem;
    align-items: stretch;
    min-width: 0;
    overflow-x: auto;
    padding-bottom: 0.1rem;
  }

  .board {
    position: relative;
    display: flex;
    flex: 0 0 calc((100% - 2.32rem) / 5);
    min-width: 0;
    min-height: 7.2rem;
    flex-direction: column;
    gap: 0.38rem;
    padding: 0.55rem 0.64rem;
    overflow: hidden;
    transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
  }

  .my-board {
    border-color: rgba(107, 184, 118, 0.9);
    background: linear-gradient(180deg, rgba(33, 41, 29, 0.88), rgba(19, 22, 18, 0.82));
    box-shadow:
      inset 0 0 0 1px rgba(177, 237, 151, 0.2),
      0 0 0 1px rgba(82, 172, 101, 0.28),
      0 1.15rem 2.25rem rgba(0, 0, 0, 0.28);
  }

  .board-heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .board-heading h2,
  .hand-area h2,
  .join-panel h1,
  .lobby-panel h1,
  .game-over-panel h1 {
    margin: 0;
  }

  .board-heading h2 {
    overflow: hidden;
    color: #fff7e7;
    font-size: 0.94rem;
    line-height: 1.1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .board-heading span {
    color: #e6bd6c;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.24rem;
  }

  .stat {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: center;
    gap: 0.24rem;
    padding: 0.18rem 0.16rem;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.06);
    color: #fff7e7;
    font-size: 0.78rem;
    font-weight: 800;
  }

  .stat img {
    width: 0.95rem;
    height: 0.95rem;
    object-fit: contain;
  }

  .contract-list {
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    gap: 0.16rem;
    margin: 0;
    padding: 0;
    overflow: hidden;
    color: rgba(255, 247, 231, 0.8);
    font-size: clamp(0.58rem, 0.78vw, 0.78rem);
    line-height: 1.1;
    list-style: none;
  }

  .contract-list li {
    display: flex;
    min-width: 0;
    align-items: flex-start;
    gap: 0.26rem;
  }

  .contract-value {
    flex: 0 0 auto;
    font-size: 1em;
    font-weight: 900;
    line-height: 1.15;
  }

  .contract-row-summary {
    min-height: 1.18rem;
  }

  .contract-state-icon {
    display: inline-flex;
    flex: 0 0 0.95rem;
    width: 0.95rem;
    height: 0.95rem;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    color: #0e0c0b;
    font-size: 0.66rem;
    font-weight: 900;
    line-height: 1;
  }

  .complete .contract-state-icon {
    background: #76d27a;
  }

  .complete .contract-value {
    color: #76d27a;
  }

  .failed .contract-state-icon {
    background: #ef5959;
  }

  .failed .contract-value {
    color: #ef5959;
  }

  .tbd .contract-state-icon {
    background: #e2bf61;
  }

  .tbd .contract-value {
    color: #e2bf61;
  }

  .contract-condition {
    display: inline-flex;
    min-width: 0;
    flex: 1 1 auto;
    align-items: center;
    align-content: flex-start;
    flex-wrap: wrap;
    gap: 0.12rem;
    color: rgba(255, 247, 231, 0.92);
    font-weight: 800;
  }

  .contract-received {
    animation: absorb-contract calc(var(--animation-speed) * 0.95) ease-out both;
  }

  @keyframes absorb-contract {
    0% {
      opacity: 0;
      transform: translateY(-1.6rem) scale(1.08);
      filter: brightness(1.35);
    }
    70% {
      opacity: 1;
      transform: translateY(0.12rem) scale(1);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
      filter: brightness(1);
    }
  }

  .contract-condition strong {
    color: #fff4dc;
    font-weight: 900;
  }

  .condition-icon {
    width: 0.82rem;
    height: 0.82rem;
    flex: 0 0 auto;
    object-fit: contain;
  }

  .light-icon {
    filter: invert(1) brightness(1.9) drop-shadow(0 0 0.16rem rgba(255, 244, 220, 0.45));
  }

  .empty-contracts {
    color: rgba(255, 247, 231, 0.42);
    font-style: italic;
  }

  .played-movies {
    display: flex;
    width: var(--table-width);
    max-width: 100%;
    gap: 0.58rem;
    align-items: flex-start;
    min-height: calc(var(--movie-card-width) * 1.42);
    padding-bottom: 0.1rem;
    overflow: visible;
  }

  .played-movie-slot {
    display: flex;
    flex: 0 0 calc((100% - 2.32rem) / 5);
    justify-content: center;
    min-width: 0;
  }

  .played-movie-card {
    width: min(var(--movie-card-width), 100%);
    animation: played-card-arrives calc(var(--animation-speed) * 0.95) cubic-bezier(0.2, 0.8, 0.18, 1) both;
    perspective: 900px;
  }

  .flip-card {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
  }

  .revealed .flip-card {
    animation: reveal-movie calc(var(--animation-speed) * 1.6) ease-in-out both;
  }

  .flip-face {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
  }

  .flip-back {
    transform: rotateY(180deg);
  }

  .selected-back {
    opacity: 0.95;
  }

  @keyframes played-card-arrives {
    0% {
      opacity: 0;
      transform: translateY(2.2rem) scale(0.88);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes reveal-movie {
    0% {
      transform: rotateY(180deg);
    }
    45% {
      transform: rotateY(180deg) scale(1.04);
    }
    100% {
      transform: rotateY(0deg) scale(1);
    }
  }

  .hand-area {
    width: calc((var(--movie-card-width) * 6) + (0.5rem * 5) + 2.25rem);
    max-width: calc(100vw - 2rem);
    align-self: center;
    overflow-x: auto;
    padding: 0.6rem 0.74rem 0.72rem;
    animation: hand-enters calc(var(--animation-speed) * 0.6) ease-out both;
  }

  .hand-area h2 {
    color: #fff7e7;
    font-size: 1rem;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .hand-cards {
    flex-wrap: nowrap;
    margin-top: 0.44rem;
  }

  .waiting-message {
    margin-top: 0.45rem;
    color: rgba(255, 247, 231, 0.74);
    font-size: 0.9rem;
  }

  @keyframes hand-enters {
    from {
      opacity: 0;
      transform: translateY(0.8rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .glass {
    width: min(100%, 42rem);
    margin: 2rem auto 0;
    padding: 1.8rem;
    text-align: center;
  }

  .players-list ul {
    margin: 1rem 0;
    padding: 0;
    list-style: none;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    margin: 1rem 0;
    border: 1px solid rgba(244, 214, 158, 0.24);
    border-radius: 8px;
    background: rgba(12, 12, 12, 0.8);
    color: white;
    font-size: 1rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    color: #1b120a;
    font-weight: 800;
    cursor: pointer;
    transition: transform 0.1s, filter 0.2s;
  }

  .btn:active {
    transform: scale(0.98);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .primary,
  .success {
    background: linear-gradient(180deg, #f6dc93, #d69d3d);
  }

  .secondary {
    background: #2f2c28;
    color: #f8ecd7;
  }

  .lobby-actions {
    display: flex;
    justify-content: center;
    gap: 0.6rem;
  }

  .game-over-panel {
    width: min(100%, 62rem);
  }

  .summary-table-wrap {
    margin-top: 1.1rem;
    overflow-x: auto;
  }

  .summary-table {
    width: 100%;
    min-width: 40rem;
    border-collapse: collapse;
    text-align: left;
  }

  .summary-table th,
  .summary-table td {
    min-width: 10rem;
    padding: 0.58rem 0.68rem;
    border: 1px solid rgba(244, 214, 158, 0.13);
    vertical-align: top;
  }

  .summary-table th:first-child {
    min-width: 7rem;
    color: rgba(255, 247, 231, 0.7);
    font-size: 0.78rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .summary-table thead th {
    color: #fff7e7;
    background: rgba(255, 255, 255, 0.07);
  }

  .summary-table tbody td,
  .summary-table tfoot td {
    background: rgba(255, 255, 255, 0.035);
  }

  .summary-table .winner-column {
    border-color: rgba(118, 210, 122, 0.55);
    background: rgba(38, 66, 37, 0.42);
  }

  .bill-score,
  .final-score {
    color: #e8c77f;
    font-size: 1.25rem;
    font-weight: 900;
  }

  .final-score {
    color: #fff4cf;
    font-size: 1.5rem;
  }

  .final-contract {
    font-size: 0.86rem;
  }

  .error-banner {
    max-width: 1280px;
    margin: 0 auto 0.75rem;
    padding: 0.8rem 1rem;
    border-radius: 8px;
    background: #b93232;
    color: white;
    text-align: center;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (max-width: 760px) {
    .game-board {
      --market-card-width: 8rem;
      --movie-card-width: 6.8rem;
      padding: 0.8rem;
    }

    .title-logo {
      width: min(28rem, 92vw);
      margin-top: -0.55rem;
    }

    .status-strip {
      flex-direction: column;
      gap: 0.16rem;
      border-radius: 8px;
    }

    .market-row {
      align-items: flex-start;
      overflow-x: auto;
    }

    .market-cards,
    .hand-cards {
      flex-wrap: nowrap;
    }

    .player-boards {
      overflow-x: auto;
      padding-bottom: 0.2rem;
    }

    .board,
    .my-board,
    .played-movie-slot {
      flex: 0 0 16rem;
    }

    .card.movie {
      width: var(--movie-card-width);
    }
  }

  @media (min-width: 761px) and (max-height: 760px) {
    .game-board {
      --market-card-width: clamp(72px, 7.35vw, 94px);
      --movie-card-width: clamp(78px, 7.9vw, 100px);
      padding-top: 0.25rem;
      padding-bottom: 0.55rem;
    }

    .cinema-header {
      gap: 0.2rem;
      margin-bottom: 0.35rem;
    }

    .title-logo {
      max-height: 5.7rem;
    }

    .status-strip {
      padding-block: 0.34rem;
    }

    .playing-state {
      gap: 0.38rem;
    }

    .market-area {
      gap: 0.24rem;
      padding: 0.38rem;
    }

    .market-row {
      gap: 0.42rem;
      padding: 0.18rem 0.24rem;
    }

    .market-cards,
    .hand-cards {
      gap: 0.42rem;
    }

    .board {
      min-height: 5.6rem;
      gap: 0.28rem;
      padding: 0.42rem 0.54rem;
    }

    .stat {
      padding-block: 0.12rem;
    }

    .hand-area {
      padding: 0.44rem 0.64rem 0.55rem;
    }

    .hand-cards {
      margin-top: 0.32rem;
    }

    .card.movie {
      width: var(--movie-card-width);
    }
  }

  .animations-disabled *,
  .animations-disabled *::before,
  .animations-disabled *::after {
    animation: none !important;
    transition-duration: 1ms !important;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation: none !important;
      transition-duration: 1ms !important;
    }
  }
</style>
