import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { gameState } from './src/lib/game-state';
import type { ServerToClientEvents, ClientToServerEvents } from './src/lib/types';

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
