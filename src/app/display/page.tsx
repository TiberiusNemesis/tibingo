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
