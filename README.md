# Tibingo

A real-time bingo number caller with a display screen and controller.

## Setup

```bash
pnpm install
pnpm dev
```

The app runs on `http://localhost:3000`.

## How to Play

Open two browser windows:

- **Display** (`/display`) - Show this on a TV or projector for all players to see
- **Controller** (`/control`) - Use this to run the game

### Controller Actions

1. **Start Game** - Begin calling numbers
2. **Call Number** - Draw the next random number
3. **Show Grid** - Display all called numbers (intermission)
4. **Winner** - Celebrate when someone wins
5. **Reset** - Start a new game

The display automatically syncs with the controller in real-time via WebSocket.
