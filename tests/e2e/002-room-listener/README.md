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

## Host removes a human player

![Host removes a human player](./screenshots/002-guest-kicked.png)

### Verifications

- [x] Removed guest is no longer seated and sees the removal notice

## Host can reserve and rename a future bot seat

![Host can reserve and rename a future bot seat](./screenshots/003-bot-added-and-renamed.png)

### Verifications

- [x] Bot occupies the reusable lobby seat with the edited name
- [x] Current implementation does not start with a bot

## Host removes a bot from its seat

![Host removes a bot from its seat](./screenshots/004-bot-kicked.png)

### Verifications

- [x] Bot seat becomes open again

