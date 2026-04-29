<script lang="ts">
  import { base } from '$app/paths';
  import { onDestroy, onMount } from 'svelte';
  import CardImage from '$lib/components/CardImage.svelte';
  import { getFirebaseServices } from '$lib/firebase/config';
  import { isGameCode, type PlayerId } from '$lib/game/actions';
  import { cardBackPath, type CardBackType } from '$lib/game/card-art';
  import { getBoxOfficeCard, getContractCard, getMovieCard, getReviewCard } from '$lib/game/cards';
  import { claimSeat, chooseContract, joinRoom, listenToActions, listenToPrivateData } from '$lib/game/firestore';
  import { callStartGame, callSubmitMovie } from '$lib/game/functions';
  import { contractConditionText, summarizePlayerState } from '$lib/game/player-summary';
  import { replayActions, setLocalPlayerId } from '$lib/game/reducer';
  import { getLocalPlayerId } from '$lib/game/session';
  import { store } from '$lib/game/store';

  const { data } = $props<{ data: { code: string } }>();

  let name = $state('Player');
  let status = $state('Connecting');
  let error = $state('');
  
  let projection = $state(store.getState().game.projection);
  let localPlayerId = $state<PlayerId | null>(null);
  let privateData = $state<{ hand: string[]; chosenMovie: string | null } | null>(null);
  let busy = $state(false);
  let expandedPlayerId = $state<PlayerId | null>(null);

  const unsubscribeStore = store.subscribe(() => {
    projection = store.getState().game.projection;
    localPlayerId = store.getState().game.localPlayerId;
  });

  onMount(() => {
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
    busy = true;
    try {
      const { functions } = getFirebaseServices();
      await callSubmitMovie(functions, data.code, getLocalPlayerId(), projection.round, movieId);
    } catch (caught) {
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
    if (projection.status === 'lobby') return 'Waiting for players to join';
    if (projection.status === 'game_over') return 'Final scores';
    if (projection.phase === 'selection') {
      return privateData?.chosenMovie
        ? 'Waiting for players to play movie cards'
        : 'Waiting for players to play movie cards';
    }
    if (projection.phase === 'contract_auction') {
      if (projection.contractPickOrder[0] === localPlayerId) return 'Your turn to pick a contract';
      const picker = projection.players.find((p) => p.id === projection.contractPickOrder[0]);
      return `Waiting for ${picker?.name ?? 'another player'} to pick a contract`;
    }
    return 'Live';
  }

  function togglePlayerBoard(playerId: PlayerId) {
    expandedPlayerId = expandedPlayerId === playerId ? null : playerId;
  }

  const isJoined = $derived(projection.players.some((p) => p.id === localPlayerId));
  const isHost = $derived(projection.players[0]?.id === localPlayerId);
  const canPlayCards = $derived(projection.phase === 'selection' && !privateData?.chosenMovie && !busy);
</script>

<main
  class="game-board"
  style={`--cinema-bg: url('${assetPath('/ui/cinema-background.png')}')`}
>
  <header class="cinema-header">
    <img class="title-logo" src={assetPath('/ui/studio-city-title.png')} alt="Studio City" />
    <div class="status-strip" aria-live="polite">
      <span>{projection.status === 'playing' ? `Round ${projection.round} of 5` : `Room ${data.code}`}</span>
      <span>{statusText()}</span>
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
  {:else if projection.status === 'lobby'}
    <div class="lobby-panel glass">
      <h1>Lobby: {data.code}</h1>
      <div class="players-list">
        <h2>Players ({projection.players.length})</h2>
        <ul>
          {#each projection.players as player}
            <li>{player.name} {player.id === localPlayerId ? '(You)' : ''}</li>
          {/each}
        </ul>
      </div>
      <div class="lobby-actions">
        {#if isHost && projection.players.length >= 2}
          <button class="btn success" disabled={busy} onclick={handleStartGame}>Start Game</button>
        {/if}
        <button class="btn secondary" onclick={handleClaimSeat}>Claim Seat</button>
      </div>
    </div>
  {:else if projection.status === 'game_over'}
    <div class="game-over-panel glass">
      <h1>Game Over</h1>
      <div class="scores">
        {#each projection.players as player}
          <div class="score-card">
            <h2>{player.name}</h2>
            <p class="final-score">{projection.playerStates[player.id]?.score ?? 0} pts</p>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="playing-state">
      <section class="market-area" aria-label="Market">
        <div class="market-row box-office-row">
          <div class="deck-stack">
            <img class="deck-card" src={deckBackSrc('boxOffice')} alt={deckBackAlt('boxOffice')} />
          </div>
          <div class="market-cards">
            {#each projection.market.boxOffice as cId}
              {@const c = getBoxOfficeCard(cId)}
              <div class="card box-office" aria-label={`${c.bills} bill box office card`}>
                <CardImage card={c} />
              </div>
            {/each}
          </div>
        </div>

        <div class="market-row review-row">
          <div class="deck-stack">
            <img class="deck-card" src={deckBackSrc('review')} alt={deckBackAlt('review')} />
          </div>
          <div class="market-cards">
            {#each projection.market.reviews as cId}
              {@const c = getReviewCard(cId)}
              <div class="card review" aria-label={`${c.stars} star review card`}>
                <CardImage card={c} />
              </div>
            {/each}
          </div>
        </div>

        <div class="market-row contract-row">
          <div class="deck-stack">
            <img class="deck-card" src={deckBackSrc('contract')} alt={deckBackAlt('contract')} />
          </div>
          <div class="market-cards">
            {#each projection.market.contracts as cId}
              {@const c = getContractCard(cId)}
              {@const canPick = projection.phase === 'contract_auction' && projection.contractPickOrder[0] === localPlayerId}
              <button
                type="button"
                class="card contract {canPick ? 'pickable' : ''}"
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
        {#each projection.players as player}
          {@const pState = projection.playerStates[player.id]}
          {@const summary = summarizePlayerState(pState)}
          <article
            class="board {player.id === localPlayerId ? 'my-board' : ''} {expandedPlayerId === player.id ? 'expanded-board' : ''}"
          >
            <button
              class="board-toggle"
              type="button"
              aria-label={`Expand ${player.name} summary`}
              onclick={() => togglePlayerBoard(player.id)}
            ></button>
            <div class="board-heading">
              <h2>{player.name}</h2>
              {#if player.id === localPlayerId}
                <span>You</span>
              {/if}
            </div>
            <div class="stats">
              <span class="stat" aria-label={`${summary.bills} bills`}>
                <img src={assetPath('/ui/icons/bill.png')} alt="" />
                {summary.bills}
              </span>
              <span class="stat" aria-label={`${summary.stars} stars`}>
                <img src={assetPath('/ui/icons/star.png')} alt="" />
                {summary.stars}
              </span>
              <span class="stat" aria-label={`${summary.loved} loved movies`}>
                <img src={assetPath('/ui/icons/loved.png')} alt="" />
                {summary.loved}
              </span>
              <span class="stat" aria-label={`${summary.blockbusters} blockbusters`}>
                <img src={assetPath('/ui/icons/blockbuster.png')} alt="" />
                {summary.blockbusters}
              </span>
            </div>
            <ul class="contract-list" aria-label={`${player.name} contracts`}>
              {#if summary.contracts.length}
                {#each summary.contracts as contract}
                  <li><strong>{contract.value}</strong><span>{contractConditionText(contract)}</span></li>
                {/each}
              {:else}
                <li class="empty-contracts">No contracts</li>
              {/if}
            </ul>
          </article>
        {/each}
      </section>

      <section class="hand-area" aria-label="Your hand">
        <h2>Your Hand</h2>
        {#if projection.phase === 'contract_auction'}
          <div class="auction-notice">
            {#if projection.contractPickOrder[0] === localPlayerId}
              <strong>It's your turn to pick a contract.</strong>
            {:else}
              Waiting for {projection.players.find((p) => p.id === projection.contractPickOrder[0])?.name} to pick a contract...
            {/if}
          </div>
        {:else if privateData?.chosenMovie}
          <div class="waiting-message">Waiting for players to play movie cards...</div>
        {/if}

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

  .playing-state {
    display: flex;
    flex-direction: column;
    gap: 0.52rem;
    max-width: 1280px;
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
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .deck-stack {
    position: relative;
    flex: 0 0 auto;
    width: var(--market-card-width);
    aspect-ratio: 7 / 5;
  }

  .deck-stack::before,
  .deck-stack::after {
    position: absolute;
    inset: 0;
    content: '';
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.12);
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.24);
  }

  .deck-stack::before {
    transform: translate(0.2rem, -0.14rem);
  }

  .deck-stack::after {
    transform: translate(0.1rem, -0.06rem);
  }

  .deck-card {
    position: relative;
    z-index: 1;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 0.55rem 0.75rem rgba(0, 0, 0, 0.38));
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
    transition: transform 0.18s ease, filter 0.18s ease, outline-color 0.18s ease, opacity 0.18s ease;
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
    width: clamp(82px, 8.6vw, 108px);
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
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(112, 178, 229, 0.32); }
    70% { box-shadow: 0 0 0 12px rgba(112, 178, 229, 0); }
    100% { box-shadow: 0 0 0 0 rgba(112, 178, 229, 0); }
  }

  .player-boards {
    display: flex;
    gap: 0.58rem;
    align-items: stretch;
    min-width: 0;
  }

  .board {
    position: relative;
    display: flex;
    flex: 1 1 0;
    min-width: 0;
    min-height: 6.5rem;
    flex-direction: column;
    gap: 0.42rem;
    padding: 0.55rem 0.64rem;
    overflow: hidden;
    transition: flex 0.2s ease, transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
  }

  .board:hover,
  .expanded-board {
    flex-grow: 2.5;
    transform: translateY(-0.22rem);
    border-color: rgba(244, 214, 158, 0.34);
    outline: none;
  }

  .board-toggle {
    position: absolute;
    inset: 0;
    z-index: 2;
    border: 0;
    border-radius: inherit;
    background: transparent;
    cursor: pointer;
  }

  .board-toggle:focus-visible {
    outline: 3px solid rgba(244, 214, 158, 0.55);
    outline-offset: -3px;
  }

  .board > :not(.board-toggle) {
    position: relative;
    z-index: 1;
    pointer-events: none;
  }

  .my-board {
    flex-grow: 2.1;
    border-color: rgba(244, 214, 158, 0.42);
    background: rgba(23, 20, 17, 0.82);
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
    gap: 0.2rem;
    margin: 0;
    padding: 0;
    overflow: hidden;
    color: rgba(255, 247, 231, 0.8);
    font-size: 0.7rem;
    line-height: 1.2;
    list-style: none;
  }

  .contract-list li {
    display: flex;
    min-width: 0;
    gap: 0.32rem;
  }

  .contract-list strong {
    flex: 0 0 auto;
    color: #e8c77f;
  }

  .contract-list span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .empty-contracts {
    color: rgba(255, 247, 231, 0.42);
    font-style: italic;
  }

  .hand-area {
    padding: 0.6rem 0.74rem 0.72rem;
  }

  .hand-area h2 {
    color: #fff7e7;
    font-size: 1rem;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .hand-cards {
    margin-top: 0.44rem;
  }

  .auction-notice,
  .waiting-message {
    margin-top: 0.45rem;
    color: rgba(255, 247, 231, 0.74);
    font-size: 0.9rem;
  }

  .glass {
    width: min(100%, 32rem);
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

  .scores {
    display: grid;
    gap: 0.75rem;
  }

  .score-card {
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.06);
    padding: 0.8rem;
  }

  .final-score {
    margin-bottom: 0;
    color: #e8c77f;
    font-size: 1.5rem;
    font-weight: 900;
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
    .my-board {
      flex: 0 0 16rem;
    }

    .card.movie {
      width: 6.8rem;
    }
  }

  @media (min-width: 761px) and (max-height: 760px) {
    .game-board {
      --market-card-width: clamp(72px, 7.35vw, 94px);
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
      width: clamp(78px, 7.9vw, 100px);
    }
  }
</style>
