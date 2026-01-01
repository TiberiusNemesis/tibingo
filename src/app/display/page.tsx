'use client';

import { useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { BingoBall } from '@/components/BingoBall';
import { NumberGrid } from '@/components/NumberGrid';
import { WinnerCelebration } from '@/components/WinnerCelebration';

const BingoBall3D = dynamic(
  () => import('@/components/BingoBall3D').then((mod) => mod.BingoBall3D),
  { ssr: false }
);

const backgroundBalls = [
  { id: 1, number: 5, size: 'lg' as const, x: '10%', y: '20%', duration: 15 },
  { id: 2, number: 20, size: 'md' as const, x: '85%', y: '15%', duration: 18 },
  { id: 3, number: 40, size: 'xl' as const, x: '20%', y: '70%', duration: 20 },
  { id: 4, number: 55, size: 'sm' as const, x: '75%', y: '80%', duration: 12 },
  { id: 5, number: 70, size: 'lg' as const, x: '50%', y: '40%', duration: 25 },
  { id: 6, number: 12, size: 'md' as const, x: '15%', y: '50%', duration: 22 },
  { id: 7, number: 28, size: 'xl' as const, x: '80%', y: '60%', duration: 19 },
  { id: 8, number: 35, size: 'sm' as const, x: '40%', y: '20%', duration: 14 },
  { id: 9, number: 50, size: 'lg' as const, x: '60%', y: '85%', duration: 17 },
  { id: 10, number: 68, size: 'md' as const, x: '30%', y: '90%', duration: 21 },
  { id: 11, number: 7, size: 'sm' as const, x: '90%', y: '30%', duration: 16 },
  { id: 12, number: 22, size: 'xl' as const, x: '5%', y: '10%', duration: 23 },
];

export default function DisplayPage() {
  const { gameState, isConnected } = useSocket();
  const { phase, currentNumber, calledNumbers } = gameState;
  const previousNumberRef = useRef<number | null>(null);

  const historyNumbers = calledNumbers
    .filter((n) => n !== currentNumber)
    .slice(-5);

  useEffect(() => {
    if (currentNumber !== null) {
      const timer = setTimeout(() => {
        previousNumberRef.current = currentNumber;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentNumber]);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-amber-50">
        <p className="text-2xl text-amber-800">Conectando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <AnimatePresence mode="wait">
        {phase === 'waiting' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden"
          >
            <div className="absolute inset-0 pointer-events-none z-0">
              {backgroundBalls.map((ball) => (
                <motion.div
                  key={ball.id}
                  className="absolute opacity-30 blur-sm mix-blend-multiply"
                  style={{ left: ball.x, top: ball.y }}
                  animate={{
                    y: [-20, 20, -20],
                    x: [-10, 10, -10],
                    rotate: 360,
                  }}
                  transition={{
                    y: {
                      duration: ball.duration,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                    x: {
                      duration: ball.duration * 1.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                    rotate: {
                      duration: ball.duration * 3,
                      repeat: Infinity,
                      ease: "linear",
                    },
                  }}
                >
                  <BingoBall number={ball.number} size={ball.size} />
                </motion.div>
              ))}
            </div>

            <motion.div
              className="relative z-10"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <h1 className="text-6xl md:text-8xl font-black text-amber-900 text-center tracking-tight drop-shadow-sm">
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
            className="relative flex flex-col items-center justify-between h-screen py-4 overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute top-4 right-4 md:top-8 md:right-8 px-4 py-2 md:px-8 md:py-4 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/50 z-20"
            >
              <p className="text-3xl md:text-6xl font-bold text-amber-900 tabular-nums">
                <span className="text-amber-600 font-black">{calledNumbers.length}</span>
                <span className="text-amber-400/80">/</span>
                <span className="text-amber-800/60">90</span>
              </p>
            </motion.div>

            <div className="flex-1 relative flex items-center justify-center min-h-0">
              <motion.div
                className="absolute w-full h-full max-w-[800px] max-h-[800px] bg-amber-400/20 blur-3xl rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <BingoBall3D
                number={currentNumber}
                previousNumber={previousNumberRef.current}
              />
            </div>

            <div className="flex-shrink-0 h-[25vh] flex items-center justify-center gap-[2vw] md:gap-[3vw] perspective-500 px-4">
              <AnimatePresence mode="popLayout" initial={false}>
                {historyNumbers.map((num) => (
                  <motion.div
                    key={num}
                    layout
                    initial={{ x: 50, opacity: 0, scale: 0.8 }}
                    animate={{ x: 0, opacity: 0.6, scale: 1 }}
                    exit={{ x: -50, opacity: 0, scale: 0.8 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      opacity: { duration: 0.2 }
                    }}
                  >
                    <BingoBall number={num} size="lg" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {phase === 'intermission' && (
          <motion.div
            key="intermission"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen p-8"
          >
            <h2 className="text-5xl md:text-7xl font-black text-amber-900 mb-12 drop-shadow-sm tracking-tight">
              Números sorteados
            </h2>
            <div className="max-w-5xl w-full p-10 bg-white/50 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/60">
              <NumberGrid calledNumbers={calledNumbers} />
            </div>
            <div className="mt-8 px-8 py-3 bg-amber-100/50 rounded-full border border-amber-200/50">
              <p className="text-3xl font-bold text-amber-800">
                Total: {calledNumbers.length} / 90
              </p>
            </div>
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
