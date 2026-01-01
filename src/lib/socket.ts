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
