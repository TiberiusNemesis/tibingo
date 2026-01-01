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
