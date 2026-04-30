# Room Listener

The room route listens to Firestore emulator actions and renders derived Redux state.

## Room route is ready

![Room route is ready](./screenshots/000-initial-room.png)

### Verifications

- [x] Room code is visible in the join panel

## Joined player is derived from replayed actions

![Joined player is derived from replayed actions](./screenshots/001-joined-room.png)

### Verifications

- [x] Lobby shows the player table
- [x] Joined player appears in the room

## Host can reserve a future bot seat

![Host can reserve a future bot seat](./screenshots/002-bot-added.png)

### Verifications

- [x] Bot occupies the next lobby seat
- [x] Current implementation does not start with a bot

