# Bingo Caller App - Design Document

A two-screen Bingo caller app for 90-ball Bingo. One screen displays to the audience (macOS), one controls the game (iPhone). Both run in browsers, connected via WebSocket for real-time sync.

**Language**: Brazilian Portuguese (pt-BR)

## Architecture

### URLs
- `http://<local-ip>:3000/display` — Full-screen number display (macOS)
- `http://<local-ip>:3000/control` — Game controller (iPhone)

### Core Flow
1. Open `/control` on iPhone, `/display` on macOS
2. Tap "Sortear" → random number selected → shown on phone only
3. Tap "Revelar" → number pushed to display screen
4. Repeat until someone wins
5. Tap "Vencedor!" → confirm → celebration on display → tap "Novo Jogo" to reset

### State Lives on Server
Next.js server holds game state. Both clients subscribe via WebSocket. Refreshing either page doesn't break anything.

---

## Display Page (`/display`)

### States

1. **Waiting** ("Aguardando início...")
   - Simple centered message
   - Classic bingo styling: cream/warm background

2. **Number Revealed**
   - Giant number centered (300-400px font)
   - Styled as glossy bingo ball with colored circle
   - Ball colors by range:
     - 1-15: Blue
     - 16-30: Red
     - 31-45: Yellow
     - 46-60: Green
     - 61-75: Purple
     - 76-90: Orange
   - Text below: "Números sorteados: X/90"

3. **Intermission** (toggled from controller)
   - 10×9 grid showing numbers 1-90
   - Called numbers: bright, full color
   - Uncalled numbers: grayed out/dimmed
   - Header: "Números sorteados"

4. **Winner**
   - "BINGO! Temos um vencedor!" with confetti
   - Stays until "Novo Jogo" tapped on controller

### Animations (Framer Motion)

- **Number reveal**: Ball drops from top with physics bounce, optional 3D spin
- **Anticipation**: Drumroll shimmer/spotlight before number appears
- **Ball styling**: Glossy 3D effect with CSS gradients, subtle floating hover
- **State transitions**: Smooth crossfades, staggered grid animation
- **Winner**: canvas-confetti explosion, pulsing/glowing text, golden shimmer

---

## Controller Page (`/control`)

Mobile-optimized, one-handed use.

### Layout (top to bottom)

1. **Current Number Preview**
   - Shows staged number before revealing
   - Same bingo ball styling
   - "Próximo número" when staged, "Toque em Sortear" when empty

2. **Action Buttons**
   - **"Sortear"** - primary button, draws random number
   - **"Revelar"** - appears after draw, pushes to display
   - **"Intervalo"** - toggles intermission grid on display

3. **Game Grid**
   - Compact 10×9 grid, all 90 numbers
   - Called = highlighted, uncalled = dimmed
   - Tappable for manual selection

4. **Bottom Bar**
   - **"Vencedor!"** - declare winner (with confirmation modal)
   - Counter: "Números sorteados: X/90"

### Winner Flow
- "Vencedor!" → modal "Confirmar vencedor?" → "Sim" / "Cancelar"
- On confirm → display celebration → controller shows "Novo Jogo"
- "Novo Jogo" → reset game

---

## Real-Time Communication

### WebSocket with socket.io

**Server → Clients**

| Event | Payload | Description |
|-------|---------|-------------|
| `sync` | `{ calledNumbers, currentNumber, phase }` | Full state on connect |
| `number-revealed` | `{ number }` | New number to display |
| `phase-change` | `{ phase }` | Display mode changed |
| `game-reset` | `{}` | Game restarted |

**Controller → Server**

| Event | Payload | Description |
|-------|---------|-------------|
| `reveal-number` | `{ number }` | Push staged number |
| `toggle-intermission` | `{}` | Switch display mode |
| `declare-winner` | `{}` | Trigger celebration |
| `new-game` | `{}` | Reset state |

### Phase State Machine
```
waiting → playing → winner → waiting
              ↓↑
         intermission
```

---

## Data Model

### Server State (source of truth)

```typescript
interface GameState {
  calledNumbers: number[]
  currentNumber: number | null
  phase: 'waiting' | 'playing' | 'intermission' | 'winner'
}
```

### Controller Local State

```typescript
interface ControllerState {
  stagedNumber: number | null  // drawn but not revealed
}
```

### Number Draw Logic (client-side)

```typescript
const remaining = allNumbers.filter(n => !calledNumbers.includes(n))
const drawn = remaining[Math.floor(Math.random() * remaining.length)]
```

---

## Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 15.x | Framework |
| `react` | 19.x | UI |
| `socket.io` | latest | WebSocket server |
| `socket.io-client` | latest | WebSocket client |
| `framer-motion` | latest | Animations |
| `canvas-confetti` | latest | Winner celebration |
| `tailwindcss` | 4.x | Styling |

## Project Structure

```
bingo-app/
├── app/
│   ├── display/page.tsx
│   ├── control/page.tsx
│   ├── layout.tsx
│   └── globals.css           # @import "tailwindcss"
├── components/
│   ├── BingoBall.tsx
│   ├── NumberGrid.tsx
│   └── WinnerCelebration.tsx
├── lib/
│   └── socket.ts
├── server.ts
└── game-state.ts
```

## Running

```bash
pnpm dev   # http://localhost:3000
```

Open `/display` on Mac, `/control` on iPhone (same WiFi).
