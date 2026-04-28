<script lang="ts">
  import { goto } from '$app/navigation';
  import { getFirebaseServices } from '$lib/firebase/config';
  import { createGameCode, isGameCode } from '$lib/game/actions';
  import { createRoom } from '$lib/game/firestore';
  import { getLocalPlayerId } from '$lib/game/session';

  let joinCode = $state('');
  let name = $state('Player');
  let error = $state('');
  let busy = $state(false);

  async function createNewRoom() {
    error = '';
    busy = true;
    const gameCode = createGameCode();
    try {
      const { db } = getFirebaseServices();
      await createRoom(db, gameCode, getLocalPlayerId(), name.trim() || 'Player');
      await goto(`/room/${gameCode}`);
    } catch (caught) {
      error = caught instanceof Error ? caught.message : 'Could not create room.';
    } finally {
      busy = false;
    }
  }

  async function joinExistingRoom() {
    error = '';
    const normalized = joinCode.trim().toUpperCase();
    if (!isGameCode(normalized)) {
      error = 'Enter a four-letter room code.';
      return;
    }
    await goto(`/room/${normalized}`);
  }
</script>

<main class="screen">
  <section class="panel" aria-labelledby="welcome-heading">
    <h1 id="welcome-heading">welcome to studio city</h1>
    <p class="muted">Create a room or join one by code.</p>

    <label>
      Player name
      <input bind:value={name} autocomplete="name" />
    </label>

    <div class="actions">
      <button type="button" disabled={busy} onclick={createNewRoom}>Create room</button>
      <input
        aria-label="Room code"
        maxlength="4"
        placeholder="ABCD"
        bind:value={joinCode}
      />
      <button class="secondary" type="button" onclick={joinExistingRoom}>Join room</button>
    </div>

    {#if error}
      <p role="alert">{error}</p>
    {/if}
  </section>
</main>
