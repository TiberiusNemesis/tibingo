'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const CONFETTI_COLORS = ['#1e40af', '#dc2626', '#eab308', '#16a34a', '#9333ea', '#ea580c'];

export function WinnerCelebration() {
  useEffect(() => {
    const duration = 5000;
    const end = Date.now() + duration;
    let animationFrameId: number;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: CONFETTI_COLORS,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: CONFETTI_COLORS,
      });

      if (Date.now() < end) {
        animationFrameId = requestAnimationFrame(frame);
      }
    };

    animationFrameId = requestAnimationFrame(frame);

    // Big burst at start
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: CONFETTI_COLORS,
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
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
