'use client';

import { motion } from 'framer-motion';

interface BingoBallProps {
  number: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  dimmed?: boolean;
}

function getBallGradient(number: number): string {
  if (number <= 15) return 'radial-gradient(circle at 30% 30%, #60a5fa, #1d4ed8)';
  if (number <= 30) return 'radial-gradient(circle at 30% 30%, #f87171, #b91c1c)';
  if (number <= 45) return 'radial-gradient(circle at 30% 30%, #facc15, #a16207)';
  if (number <= 60) return 'radial-gradient(circle at 30% 30%, #4ade80, #15803d)';
  if (number <= 75) return 'radial-gradient(circle at 30% 30%, #c084fc, #7e22ce)';
  return 'radial-gradient(circle at 30% 30%, #fb923c, #c2410c)';
}

function getSizeClasses(size: 'sm' | 'md' | 'lg' | 'xl'): { container: string; text: string } {
  switch (size) {
    case 'sm':
      return { container: 'w-8 h-8', text: 'text-sm' };
    case 'md':
      return { container: 'w-16 h-16', text: 'text-2xl' };
    case 'lg':
      return { container: 'w-[min(8rem,15vw,18vh)] h-[min(8rem,15vw,18vh)]', text: 'text-[min(3rem,5vw,6vh)]' };
    case 'xl':
      return { container: 'w-[min(16rem,25vw,25vh)] h-[min(16rem,25vw,25vh)]', text: 'text-[min(6rem,8vw,8vh)]' };
  }
}

export function BingoBall({ number, size = 'md', animate = false, dimmed = false }: BingoBallProps) {
  const sizeClasses = getSizeClasses(size);
  const gradientBackground = getBallGradient(number);

  const ball = (
    <div
      className={`
        ${sizeClasses.container}
        rounded-full
        flex items-center justify-center
        shadow-lg shadow-inner
        relative
        overflow-hidden
        ${dimmed ? 'opacity-30 grayscale' : ''}
      `}
      style={{ background: gradientBackground }}
    >
      {/* Glossy highlight */}
      <div className="absolute top-1 left-1/4 w-1/3 h-1/4 bg-white/40 rounded-full blur-sm" />

      {/* Number */}
      <span className={`${sizeClasses.text} font-[family-name:var(--font-space-mono)] font-bold text-white drop-shadow-lg relative z-10`}>
        {number}
      </span>
    </div>
  );

  if (!animate) return ball;

  return (
    <motion.div
      initial={{ y: -300, opacity: 0, scale: 0.5, rotateX: 180, scaleX: 1, scaleY: 1 }}
      animate={{
        y: 0,
        opacity: 1,
        scale: 1,
        rotateX: 0,
        scaleX: [1, 1.15, 0.95, 1],
        scaleY: [1, 0.85, 1.05, 1],
      }}
      transition={{
        y: { type: 'spring', stiffness: 350, damping: 25, mass: 1.5 },
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 },
        rotateX: { duration: 0.6 },
        scaleX: { delay: 0.3, duration: 0.4, times: [0, 0.4, 0.7, 1] },
        scaleY: { delay: 0.3, duration: 0.4, times: [0, 0.4, 0.7, 1] },
      }}
    >
      <motion.div
        animate={{
          rotateX: [0, 10, 0, -10, 0],
          rotateY: [0, 10, 0, -10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {ball}
      </motion.div>
    </motion.div>
  );
}
