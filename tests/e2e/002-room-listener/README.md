# Room Listener

The room route listens to Firestore emulator actions, auto-joins linked visitors, and renders derived Redux state.

## Host creates a room

![Host creates a room](./screenshots/000-host-room.png)

### Verifications

- [x] Host appears in the lobby table

## Room link auto-joins a guest

![Room link auto-joins a guest](./screenshots/001-linked-guest-joined.png)

### Verifications

- [x] Guest appears in the lobby table

## Host can reserve a future bot seat

![Host can reserve a future bot seat](./screenshots/002-bot-added.png)

### Verifications

- [x] Bot occupies the next lobby seat
- [x] Current implementation does not start with a bot

