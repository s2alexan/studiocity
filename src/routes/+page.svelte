<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { getFirebaseServices } from '$lib/firebase/config';
  import { createGameCode } from '$lib/game/actions';
  import { createRoom } from '$lib/game/firestore';
  import { getLocalPlayerId } from '$lib/game/session';

  let name = $state('Player');
  let error = $state('');
  let busy = $state(false);

  function assetPath(path: string) {
    return `${base}${path}`;
  }

  async function createNewRoom() {
    error = '';
    busy = true;
    const gameCode = createGameCode();
    try {
      const { db } = getFirebaseServices();
      await createRoom(db, gameCode, getLocalPlayerId(), name.trim() || 'Player');
      await goto(`${base}/room/${gameCode}`);
    } catch (caught) {
      error = caught instanceof Error ? caught.message : 'Could not create room.';
    } finally {
      busy = false;
    }
  }

</script>

<main
  class="screen"
  style={`--cinema-bg: url('${assetPath('/ui/cinema-background.png')}')`}
>
  <section class="panel">
    <label>
      Name
      <input bind:value={name} autocomplete="name" />
    </label>

    <div class="actions">
      <button type="button" disabled={busy} onclick={createNewRoom}>Create room</button>
    </div>

    {#if error}
      <p role="alert">{error}</p>
    {/if}
  </section>
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

  .screen {
    position: relative;
    display: grid;
    min-height: 100vh;
    place-items: start center;
    padding: 0.55rem 1rem 2rem;
    isolation: isolate;
  }

  .screen::before {
    position: fixed;
    inset: 0;
    z-index: -2;
    content: '';
    background-image: linear-gradient(rgba(6, 5, 5, 0.18), rgba(6, 5, 5, 0.38)), var(--cinema-bg);
    background-size: cover;
    background-position: center;
  }

  .screen::after {
    position: fixed;
    inset: 0;
    z-index: -1;
    content: '';
    pointer-events: none;
    background:
      radial-gradient(circle at 50% 12%, rgba(228, 179, 101, 0.16), transparent 30rem),
      linear-gradient(180deg, rgba(7, 6, 6, 0.04), rgba(7, 6, 6, 0.42));
  }

  .panel {
    width: min(100%, 34rem);
    margin-top: clamp(0rem, 5vh, 3rem);
    padding: 0 1.4rem 1.7rem;
    border: 1px solid rgba(244, 214, 158, 0.13);
    border-radius: 8px;
    background: rgba(13, 13, 12, 0.72);
    box-shadow: 0 1.15rem 2.25rem rgba(0, 0, 0, 0.28);
    text-align: center;
    backdrop-filter: blur(10px);
  }

  label {
    display: grid;
    gap: 0.35rem;
    color: rgba(255, 247, 231, 0.82);
    font-size: 0.86rem;
    font-weight: 800;
    text-align: left;
    text-transform: uppercase;
  }

  input {
    width: 100%;
    padding: 0.72rem 0.8rem;
    border: 1px solid rgba(244, 214, 158, 0.24);
    border-radius: 8px;
    background: rgba(12, 12, 12, 0.8);
    color: white;
    font: inherit;
    font-size: 1rem;
  }

  input::placeholder {
    color: rgba(255, 247, 231, 0.5);
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.7rem;
    align-items: center;
    margin-top: 1rem;
  }

  button {
    padding: 0.75rem 1rem;
    border: 0;
    border-radius: 8px;
    background: linear-gradient(180deg, #f6dc93, #d69d3d);
    color: #1b120a;
    font: inherit;
    font-weight: 900;
    cursor: pointer;
    transition: transform 0.1s, filter 0.2s;
  }

  button:active {
    transform: scale(0.98);
  }

  button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  [role='alert'] {
    margin: 1rem 0 0;
    padding: 0.7rem 0.8rem;
    border-radius: 8px;
    background: #b93232;
    color: white;
    font-weight: 700;
  }

  @media (max-width: 640px) {
    .screen {
      padding: 0.8rem;
    }

    .panel {
      padding: 0 1rem 1.2rem;
    }

    .actions {
      grid-template-columns: 1fr;
    }
  }
</style>
