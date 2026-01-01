# Bingo Caller App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a two-screen Bingo caller app with macOS display and iPhone controller, connected via WebSocket.

**Architecture:** Next.js 15 app with custom server for socket.io integration. Server holds game state, both clients subscribe. Display shows numbers/grid, controller manages game flow.

**Tech Stack:** Next.js 15, React 19, socket.io, Framer Motion, canvas-confetti, Tailwind CSS 4, pnpm

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `app/globals.css`
- Create: `app/layout.tsx`

**Step 1: Initialize Next.js project**

```bash
cd /Users/hiddenwater/Repos/bingo-app
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --turbopack
```

Select defaults when prompted.

**Step 2: Install additional dependencies**

```bash
pnpm add socket.io socket.io-client framer-motion canvas-confetti
pnpm add -D @types/canvas-confetti
```

**Step 3: Update globals.css for Tailwind v4**

Replace `app/globals.css` with:

```css
@import "tailwindcss";

:root {
  --color-bingo-blue: #1e40af;
  --color-bingo-red: #dc2626;
  --color-bingo-yellow: #eab308;
  --color-bingo-green: #16a34a;
  --color-bingo-purple: #9333ea;
  --color-bingo-orange: #ea580c;
  --color-bingo-cream: #fef3c7;
}
```

**Step 4: Update layout.tsx for pt-BR**

Replace `app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bingo - Sorteio",
  description: "Aplicativo de sorteio de Bingo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

**Step 5: Verify setup**

```bash
pnpm dev
```

Open http://localhost:3000 - should see Next.js default page.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: initialize next.js project with dependencies"
```

---

## Task 2: Game State & Types

**Files:**
- Create: `lib/types.ts`
- Create: `lib/game-state.ts`

**Step 1: Create type definitions**

Create `lib/types.ts`:

```typescript
export type GamePhase = 'waiting' | 'playing' | 'intermission' | 'winner';

export interface GameState {
  calledNumbers: number[];
  currentNumber: number | null;
  phase: GamePhase;
}

export interface ServerToClientEvents {
  sync: (state: GameState) => void;
  'number-revealed': (data: { number: number }) => void;
  'phase-change': (data: { phase: GamePhase }) => void;
  'game-reset': () => void;
}

export interface ClientToServerEvents {
  'reveal-number': (data: { number: number }) => void;
  'toggle-intermission': () => void;
  'declare-winner': () => void;
  'new-game': () => void;
}
```

**Step 2: Create game state manager**

Create `lib/game-state.ts`:

```typescript
import { GameState, GamePhase } from './types';

class GameStateManager {
  private state: GameState = {
    calledNumbers: [],
    currentNumber: null,
    phase: 'waiting',
  };

  getState(): GameState {
    return { ...this.state };
  }

  revealNumber(number: number): GameState {
    if (this.state.calledNumbers.includes(number)) {
      return this.state;
    }
    this.state.calledNumbers.push(number);
    this.state.currentNumber = number;
    if (this.state.phase === 'waiting' || this.state.phase === 'intermission') {
      this.state.phase = 'playing';
    }
    return this.getState();
  }

  toggleIntermission(): GameState {
    if (this.state.phase === 'playing') {
      this.state.phase = 'intermission';
    } else if (this.state.phase === 'intermission') {
      this.state.phase = 'playing';
    }
    return this.getState();
  }

  declareWinner(): GameState {
    this.state.phase = 'winner';
    return this.getState();
  }

  reset(): GameState {
    this.state = {
      calledNumbers: [],
      currentNumber: null,
      phase: 'waiting',
    };
    return this.getState();
  }
}

export const gameState = new GameStateManager();
```

**Step 3: Commit**

```bash
git add lib/
git commit -m "feat: add game state types and manager"
```

---

## Task 3: Custom Server with Socket.io

**Files:**
- Create: `server.ts`
- Modify: `package.json` (scripts)

**Step 1: Create custom server**

Create `server.ts`:

```typescript
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { gameState } from './lib/game-state';
import type { ServerToClientEvents, ClientToServerEvents } from './lib/types';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send current state on connect
    socket.emit('sync', gameState.getState());

    socket.on('reveal-number', ({ number }) => {
      const state = gameState.revealNumber(number);
      io.emit('number-revealed', { number });
      io.emit('sync', state);
    });

    socket.on('toggle-intermission', () => {
      const state = gameState.toggleIntermission();
      io.emit('phase-change', { phase: state.phase });
      io.emit('sync', state);
    });

    socket.on('declare-winner', () => {
      const state = gameState.declareWinner();
      io.emit('phase-change', { phase: 'winner' });
      io.emit('sync', state);
    });

    socket.on('new-game', () => {
      const state = gameState.reset();
      io.emit('game-reset');
      io.emit('sync', state);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
```

**Step 2: Update package.json scripts**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "dev": "ts-node --project tsconfig.server.json server.ts",
    "build": "next build",
    "start": "NODE_ENV=production ts-node --project tsconfig.server.json server.ts"
  }
}
```

**Step 3: Create server tsconfig**

Create `tsconfig.server.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "noEmit": false,
    "outDir": "./dist"
  },
  "include": ["server.ts", "lib/**/*"]
}
```

**Step 4: Install ts-node**

```bash
pnpm add -D ts-node
```

**Step 5: Verify server starts**

```bash
pnpm dev
```

Should see: `> Ready on http://0.0.0.0:3000`

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add custom server with socket.io"
```

---

## Task 4: Socket Client Hook

**Files:**
- Create: `lib/socket.ts`
- Create: `hooks/useSocket.ts`

**Step 1: Create socket client instance**

Create `lib/socket.ts`:

```typescript
'use client';

import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from './types';

export type BingoSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: BingoSocket | null = null;

export function getSocket(): BingoSocket {
  if (!socket) {
    socket = io({
      autoConnect: true,
    });
  }
  return socket;
}
```

**Step 2: Create useSocket hook**

Create `hooks/useSocket.ts`:

```typescript
'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSocket, BingoSocket } from '@/lib/socket';
import type { GameState } from '@/lib/types';

const initialState: GameState = {
  calledNumbers: [],
  currentNumber: null,
  phase: 'waiting',
};

export function useSocket() {
  const [socket, setSocket] = useState<BingoSocket | null>(null);
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = getSocket();
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('sync', (state) => {
      setGameState(state);
    });

    return () => {
      socketInstance.off('connect');
      socketInstance.off('disconnect');
      socketInstance.off('sync');
    };
  }, []);

  const revealNumber = useCallback((number: number) => {
    socket?.emit('reveal-number', { number });
  }, [socket]);

  const toggleIntermission = useCallback(() => {
    socket?.emit('toggle-intermission');
  }, [socket]);

  const declareWinner = useCallback(() => {
    socket?.emit('declare-winner');
  }, [socket]);

  const newGame = useCallback(() => {
    socket?.emit('new-game');
  }, [socket]);

  return {
    gameState,
    isConnected,
    revealNumber,
    toggleIntermission,
    declareWinner,
    newGame,
  };
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add socket client and useSocket hook"
```

---

## Task 5: BingoBall Component

**Files:**
- Create: `components/BingoBall.tsx`

**Step 1: Create BingoBall component with animations**

Create `components/BingoBall.tsx`:

```tsx
'use client';

import { motion } from 'framer-motion';

interface BingoBallProps {
  number: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  dimmed?: boolean;
}

function getBallColor(number: number): string {
  if (number <= 15) return 'from-blue-500 to-blue-700';
  if (number <= 30) return 'from-red-500 to-red-700';
  if (number <= 45) return 'from-yellow-400 to-yellow-600';
  if (number <= 60) return 'from-green-500 to-green-700';
  if (number <= 75) return 'from-purple-500 to-purple-700';
  return 'from-orange-500 to-orange-700';
}

function getSizeClasses(size: 'sm' | 'md' | 'lg' | 'xl'): { container: string; text: string } {
  switch (size) {
    case 'sm':
      return { container: 'w-8 h-8', text: 'text-sm' };
    case 'md':
      return { container: 'w-16 h-16', text: 'text-2xl' };
    case 'lg':
      return { container: 'w-32 h-32', text: 'text-5xl' };
    case 'xl':
      return { container: 'w-64 h-64 md:w-80 md:h-80', text: 'text-8xl md:text-9xl' };
  }
}

export function BingoBall({ number, size = 'md', animate = false, dimmed = false }: BingoBallProps) {
  const colorClass = getBallColor(number);
  const sizeClasses = getSizeClasses(size);

  const ball = (
    <div
      className={`
        ${sizeClasses.container}
        rounded-full
        bg-gradient-to-br ${colorClass}
        flex items-center justify-center
        shadow-lg
        relative
        overflow-hidden
        ${dimmed ? 'opacity-30 grayscale' : ''}
      `}
    >
      {/* Glossy highlight */}
      <div className="absolute top-1 left-1/4 w-1/3 h-1/4 bg-white/40 rounded-full blur-sm" />

      {/* Number */}
      <span className={`${sizeClasses.text} font-bold text-white drop-shadow-lg relative z-10`}>
        {number}
      </span>
    </div>
  );

  if (!animate) return ball;

  return (
    <motion.div
      initial={{ y: -300, opacity: 0, scale: 0.5, rotateX: 180 }}
      animate={{
        y: 0,
        opacity: 1,
        scale: 1,
        rotateX: 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
        duration: 0.8,
      }}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {ball}
      </motion.div>
    </motion.div>
  );
}
```

**Step 2: Commit**

```bash
git add components/
git commit -m "feat: add BingoBall component with animations"
```

---

## Task 6: NumberGrid Component

**Files:**
- Create: `components/NumberGrid.tsx`

**Step 1: Create NumberGrid component**

Create `components/NumberGrid.tsx`:

```tsx
'use client';

import { motion } from 'framer-motion';
import { BingoBall } from './BingoBall';

interface NumberGridProps {
  calledNumbers: number[];
  onNumberClick?: (number: number) => void;
  interactive?: boolean;
}

export function NumberGrid({ calledNumbers, onNumberClick, interactive = false }: NumberGridProps) {
  const numbers = Array.from({ length: 90 }, (_, i) => i + 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-10 gap-1 md:gap-2 p-2 md:p-4"
    >
      {numbers.map((number, index) => {
        const isCalled = calledNumbers.includes(number);

        return (
          <motion.div
            key={number}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.01 }}
            onClick={() => interactive && !isCalled && onNumberClick?.(number)}
            className={interactive && !isCalled ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
          >
            <BingoBall
              number={number}
              size="sm"
              dimmed={!isCalled}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
```

**Step 2: Commit**

```bash
git add components/
git commit -m "feat: add NumberGrid component"
```

---

## Task 7: WinnerCelebration Component

**Files:**
- Create: `components/WinnerCelebration.tsx`

**Step 1: Create WinnerCelebration component**

Create `components/WinnerCelebration.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export function WinnerCelebration() {
  useEffect(() => {
    const duration = 5000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#1e40af', '#dc2626', '#eab308', '#16a34a', '#9333ea', '#ea580c'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#1e40af', '#dc2626', '#eab308', '#16a34a', '#9333ea', '#ea580c'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Big burst at start
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#1e40af', '#dc2626', '#eab308', '#16a34a', '#9333ea', '#ea580c'],
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 10,
        }}
        className="text-center"
      >
        <motion.h1
          animate={{
            scale: [1, 1.1, 1],
            textShadow: [
              '0 0 20px rgba(255,255,255,0.5)',
              '0 0 40px rgba(255,255,255,0.8)',
              '0 0 20px rgba(255,255,255,0.5)',
            ],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
          className="text-6xl md:text-8xl font-bold text-white mb-4 drop-shadow-lg"
        >
          BINGO!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-2xl md:text-4xl text-white/90 font-semibold"
        >
          Temos um vencedor!
        </motion.p>
      </motion.div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/
git commit -m "feat: add WinnerCelebration component with confetti"
```

---

## Task 8: Display Page

**Files:**
- Create: `app/display/page.tsx`

**Step 1: Create display page**

Create `app/display/page.tsx`:

```tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { BingoBall } from '@/components/BingoBall';
import { NumberGrid } from '@/components/NumberGrid';
import { WinnerCelebration } from '@/components/WinnerCelebration';

export default function DisplayPage() {
  const { gameState, isConnected } = useSocket();
  const { phase, currentNumber, calledNumbers } = gameState;

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-amber-50">
        <p className="text-2xl text-amber-800">Conectando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <AnimatePresence mode="wait">
        {phase === 'waiting' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-amber-800 text-center">
                Aguardando início...
              </h1>
            </motion.div>
          </motion.div>
        )}

        {phase === 'playing' && currentNumber && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen gap-8"
          >
            <BingoBall number={currentNumber} size="xl" animate />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-2xl text-amber-700"
            >
              Números sorteados: {calledNumbers.length}/90
            </motion.p>
          </motion.div>
        )}

        {phase === 'intermission' && (
          <motion.div
            key="intermission"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen p-4"
          >
            <h2 className="text-3xl font-bold text-amber-800 mb-4">
              Números sorteados
            </h2>
            <div className="max-w-2xl">
              <NumberGrid calledNumbers={calledNumbers} />
            </div>
            <p className="text-xl text-amber-700 mt-4">
              {calledNumbers.length}/90
            </p>
          </motion.div>
        )}

        {phase === 'winner' && (
          <motion.div
            key="winner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <WinnerCelebration />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Step 2: Verify display page**

```bash
pnpm dev
```

Open http://localhost:3000/display - should see "Aguardando início..."

**Step 3: Commit**

```bash
git add app/display/
git commit -m "feat: add display page with all states"
```

---

## Task 9: Controller Page

**Files:**
- Create: `app/control/page.tsx`

**Step 1: Create controller page**

Create `app/control/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { BingoBall } from '@/components/BingoBall';
import { NumberGrid } from '@/components/NumberGrid';

export default function ControlPage() {
  const { gameState, isConnected, revealNumber, toggleIntermission, declareWinner, newGame } = useSocket();
  const { phase, calledNumbers } = gameState;

  const [stagedNumber, setStagedNumber] = useState<number | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  const remainingNumbers = Array.from({ length: 90 }, (_, i) => i + 1)
    .filter(n => !calledNumbers.includes(n));

  const handleDraw = () => {
    if (remainingNumbers.length === 0) return;
    const randomIndex = Math.floor(Math.random() * remainingNumbers.length);
    setStagedNumber(remainingNumbers[randomIndex]);
  };

  const handleReveal = () => {
    if (stagedNumber === null) return;
    revealNumber(stagedNumber);
    setStagedNumber(null);
  };

  const handleManualSelect = (number: number) => {
    setStagedNumber(number);
  };

  const handleConfirmWinner = () => {
    declareWinner();
    setShowWinnerModal(false);
  };

  const handleNewGame = () => {
    newGame();
    setStagedNumber(null);
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <p className="text-xl text-white">Conectando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 pb-24">
      {/* Staged Number Preview */}
      <div className="flex flex-col items-center mb-6">
        <p className="text-sm text-slate-400 mb-2">
          {stagedNumber ? 'Próximo número' : 'Toque em Sortear'}
        </p>
        <div className="h-24 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {stagedNumber && (
              <motion.div
                key={stagedNumber}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
              >
                <BingoBall number={stagedNumber} size="lg" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 mb-6">
        {phase !== 'winner' && (
          <>
            <button
              onClick={handleDraw}
              disabled={remainingNumbers.length === 0}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl font-bold text-xl transition-colors"
            >
              Sortear
            </button>

            <AnimatePresence>
              {stagedNumber && (
                <motion.button
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onClick={handleReveal}
                  className="w-full py-4 bg-green-500 hover:bg-green-600 rounded-xl font-bold text-xl transition-colors"
                >
                  Revelar
                </motion.button>
              )}
            </AnimatePresence>

            <button
              onClick={toggleIntermission}
              className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                phase === 'intermission'
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              {phase === 'intermission' ? 'Voltar ao Jogo' : 'Intervalo'}
            </button>
          </>
        )}

        {phase === 'winner' && (
          <button
            onClick={handleNewGame}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 rounded-xl font-bold text-xl transition-colors"
          >
            Novo Jogo
          </button>
        )}
      </div>

      {/* Number Grid */}
      <div className="mb-6">
        <p className="text-sm text-slate-400 mb-2 text-center">
          Toque para selecionar manualmente
        </p>
        <NumberGrid
          calledNumbers={calledNumbers}
          onNumberClick={handleManualSelect}
          interactive={phase !== 'winner'}
        />
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-4 flex items-center justify-between">
        <span className="text-slate-400">
          Sorteados: {calledNumbers.length}/90
        </span>
        {phase !== 'winner' && (
          <button
            onClick={() => setShowWinnerModal(true)}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-colors"
          >
            Vencedor!
          </button>
        )}
      </div>

      {/* Winner Confirmation Modal */}
      <AnimatePresence>
        {showWinnerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
            onClick={() => setShowWinnerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm"
            >
              <h2 className="text-2xl font-bold text-center mb-4">
                Confirmar vencedor?
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWinnerModal(false)}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmWinner}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-600 rounded-xl font-semibold transition-colors"
                >
                  Sim
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Step 2: Verify controller page**

Open http://localhost:3000/control on phone or in browser dev tools mobile view.

**Step 3: Commit**

```bash
git add app/control/
git commit -m "feat: add controller page with all functionality"
```

---

## Task 10: Update Home Page with Links

**Files:**
- Modify: `app/page.tsx`

**Step 1: Update home page**

Replace `app/page.tsx` with:

```tsx
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center gap-8 p-4">
      <h1 className="text-4xl font-bold text-amber-800">Bingo</h1>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link
          href="/display"
          className="block w-full py-4 bg-amber-500 hover:bg-amber-600 text-white text-center rounded-xl font-bold text-xl transition-colors"
        >
          Tela de Exibição
        </Link>
        <Link
          href="/control"
          className="block w-full py-4 bg-slate-800 hover:bg-slate-700 text-white text-center rounded-xl font-bold text-xl transition-colors"
        >
          Controle
        </Link>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add home page with navigation links"
```

---

## Task 11: Final Testing & Polish

**Step 1: Full end-to-end test**

1. Run `pnpm dev`
2. Open `/display` in one browser window (or on Mac)
3. Open `/control` in another window (or on iPhone via local IP)
4. Draw numbers, reveal, check sync
5. Toggle intermission, verify grid shows
6. Declare winner, verify celebration
7. Start new game, verify reset

**Step 2: Get local IP for iPhone access**

```bash
ipconfig getifaddr en0
```

Access via `http://<IP>:3000/control` on iPhone.

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup and testing"
```

---

## Summary

Total tasks: 11
Estimated parallel agents possible: 3-4 (Tasks 5-7 components can run in parallel)

**Critical path:**
1. Task 1 (setup) →
2. Task 2-3 (state + server) →
3. Task 4 (socket hook) →
4. Tasks 5-7 (components, parallel) →
5. Tasks 8-9 (pages) →
6. Task 10-11 (polish)
