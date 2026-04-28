<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { getFirebaseServices } from '$lib/firebase/config';
  import { isGameCode, type PlayerId } from '$lib/game/actions';
  import { getBoxOfficeCard, getContractCard, getMovieCard, getReviewCard } from '$lib/game/cards';
  import { claimSeat, chooseContract, joinRoom, listenToActions, listenToPrivateData } from '$lib/game/firestore';
  import { callStartGame, callSubmitMovie } from '$lib/game/functions';
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

  const isJoined = $derived(projection.players.some((p) => p.id === localPlayerId));
  const isHost = $derived(projection.players[0]?.id === localPlayerId);
</script>

<main class="game-board">
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
      <h1>Game Over!</h1>
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
    <!-- Playing State -->
    <div class="playing-state">
      <header class="game-header">
        <h1>Round {projection.round}</h1>
        <div class="phase-badge">Phase: {projection.phase.replace('_', ' ')}</div>
      </header>

      <div class="market-area">
        <h2>The Market</h2>
        <div class="market-decks">
          <div class="deck-group">
            <h3>Box Office</h3>
            <div class="cards">
              {#each projection.market.boxOffice as cId}
                {@const c = getBoxOfficeCard(cId)}
                <div class="card box-office">
                  <span class="value">{c.bills} Bills</span>
                </div>
              {/each}
            </div>
          </div>
          
          <div class="deck-group">
            <h3>Reviews</h3>
            <div class="cards">
              {#each projection.market.reviews as cId}
                {@const c = getReviewCard(cId)}
                <div class="card review">
                  <span class="value">{c.stars} Stars</span>
                </div>
              {/each}
            </div>
          </div>

          <div class="deck-group">
            <h3>Contracts</h3>
            <div class="cards">
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
                  <strong>{c.title}</strong>
                  <span class="value">{c.value} pts</span>
                  <span class="desc">{c.description}</span>
                </button>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <div class="player-boards">
        {#each projection.players as player}
          {@const pState = projection.playerStates[player.id]}
          <div class="board {player.id === localPlayerId ? 'my-board' : ''}">
            <h3>{player.name} {player.id === localPlayerId ? '(You)' : ''}</h3>
            <div class="stats">
              <span>BO: {pState?.boxOffice.length ?? 0}</span>
              <span>Rev: {pState?.reviews.length ?? 0}</span>
              <span>Con: {pState?.contracts.length ?? 0}</span>
            </div>
          </div>
        {/each}
      </div>

      <div class="hand-area">
        <h2>Your Hand</h2>
        {#if projection.phase === 'selection'}
          {#if privateData?.chosenMovie}
            <div class="waiting-message">Waiting for others to choose...</div>
          {:else}
            {#if privateData?.hand?.length}
              <div class="cards">
                {#each privateData.hand as movieId}
                  {@const m = getMovieCard(movieId)}
                  {#if m}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div class="card movie playable" onclick={() => handlePlayMovie(movieId)}>
                      <strong>{m.title}</strong>
                      <div class="ranks">
                        <span class="r-bo" title="Box Office Rank">{m.boxOfficeRank}</span>
                        <span class="r-rev" title="Review Rank">{m.reviewRank}</span>
                        <span class="r-con" title="Contract Rank">{m.contractRank}</span>
                      </div>
                    </div>
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
          {/if}
        {:else if projection.phase === 'contract_auction'}
          <div class="auction-notice">
            {#if projection.contractPickOrder[0] === localPlayerId}
              <strong>It's your turn! Pick a contract from the market.</strong>
            {:else}
              Waiting for {projection.players.find((p) => p.id === projection.contractPickOrder[0])?.name} to pick a contract...
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: 'Inter', system-ui, sans-serif;
    background-color: #1a1a1a;
    color: #f0f0f0;
  }

  .game-board {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  }

  .join-panel, .lobby-panel, .game-over-panel {
    max-width: 500px;
    margin: 4rem auto;
    text-align: center;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    margin: 1rem 0;
    border-radius: 8px;
    border: 1px solid #444;
    background: #2a2a2a;
    color: white;
    font-size: 1rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
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

  .primary {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
  }

  .success {
    background: linear-gradient(135deg, #10b981, #3b82f6);
    color: white;
  }

  .secondary {
    background: #444;
    color: white;
  }

  .cards {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    margin-top: 1rem;
  }

  .card {
    background: #2a2a2a;
    border: 0;
    color: inherit;
    font: inherit;
    border-radius: 12px;
    padding: 1rem;
    width: 120px;
    height: 160px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    transition: transform 0.2s;
  }

  .card:disabled {
    cursor: not-allowed;
  }

  .card.movie {
    background: linear-gradient(135deg, #374151, #1f2937);
    justify-content: space-between;
  }

  .playable:hover, .pickable:hover {
    transform: translateY(-8px);
    cursor: pointer;
    box-shadow: 0 8px 15px rgba(0,0,0,0.4);
  }

  .pickable {
    border: 2px solid #8b5cf6;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
    100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
  }

  .card.box-office { border-top: 6px solid #10b981; }
  .card.review { border-top: 6px solid #fbbf24; }
  .card.contract { border-top: 6px solid #6366f1; }

  .ranks {
    display: flex;
    gap: 0.5rem;
    font-size: 0.8rem;
    font-weight: bold;
  }
  .r-bo { color: #10b981; }
  .r-rev { color: #fbbf24; }
  .r-con { color: #6366f1; }

  .deck-group {
    background: rgba(0,0,0,0.2);
    padding: 1rem;
    border-radius: 12px;
  }

  .player-boards {
    display: flex;
    gap: 1rem;
  }

  .board {
    flex: 1;
    background: #222;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #333;
  }

  .my-board {
    border-color: #8b5cf6;
  }

  .stats {
    display: flex;
    gap: 1rem;
    color: #aaa;
    font-size: 0.9rem;
  }

  .error-banner {
    background: #ef4444;
    color: white;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
  }
</style>
