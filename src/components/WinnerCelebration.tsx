'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

const CONFETTI_COLORS = ['#FFD700', '#FFC107', '#FFEB3B', '#C0C0C0', '#E6E6E6', '#FFFFFF'];
const RAYS = [0, 1, 2, 3, 4, 5, 6, 7];

export function WinnerCelebration() {
  useEffect(() => {
    const duration = 15000;
    const end = Date.now() + duration;
    let animationFrameId: number;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: CONFETTI_COLORS,
        shapes: ['circle', 'square'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: CONFETTI_COLORS,
        shapes: ['circle', 'square'],
      });

      if (Math.random() < 0.3) {
        confetti({
          particleCount: 5,
          angle: 270,
          spread: 180,
          origin: { x: 0.5, y: -0.1 },
          colors: CONFETTI_COLORS,
          shapes: ['star'],
          gravity: 0.8,
          scalar: 1.2,
          ticks: 300,
        });
      }

      if (Date.now() < end) {
        animationFrameId = requestAnimationFrame(frame);
      }
    };

    animationFrameId = requestAnimationFrame(frame);

    const fireBurst = (x: number, y: number) => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { x, y },
        colors: CONFETTI_COLORS,
        shapes: ['star', 'circle'],
        gravity: 1.2,
        scalar: 1.2,
      });
    };

    fireBurst(0.5, 0.5);
    setTimeout(() => fireBurst(0.2, 0.5), 200);
    setTimeout(() => fireBurst(0.8, 0.5), 400);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {RAYS.map((i) => (
          <motion.div
            key={i}
            className="absolute w-24 h-[150vh] bg-gradient-to-t from-transparent via-white/10 to-transparent blur-md origin-center"
            style={{ rotate: `${i * 45}deg` }}
            animate={{ rotate: `${i * 45 + 360}deg` }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 10,
        }}
        className="relative z-10 text-center"
      >
        <motion.h1
          animate={{
            scale: [1, 1.05, 1],
            filter: [
              'drop-shadow(0 0 20px rgba(255,215,0,0.5))',
              'drop-shadow(0 0 50px rgba(255,255,255,0.8))',
              'drop-shadow(0 0 20px rgba(255,215,0,0.5))',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-8xl md:text-[10rem] font-black mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-100 to-yellow-300 drop-shadow-2xl"
        >
          BINGO!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-3xl md:text-5xl text-white font-bold tracking-wider drop-shadow-md"
        >
          Temos um vencedor!
        </motion.p>
      </motion.div>
    </div>
  );
}
