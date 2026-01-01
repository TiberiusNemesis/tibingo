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
