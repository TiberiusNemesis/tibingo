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
