'use client';

import { motion } from 'framer-motion';

interface BingoBallProps {
  number: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  dimmed?: boolean;
}

function getBallColor(number: number): string {
  if (number <= 15) return 'from-blue-500 to-blue-700';
  if (number <= 30) return 'from-red-500 to-red-700';
  if (number <= 45) return 'from-yellow-400 to-yellow-600';
  if (number <= 60) return 'from-green-500 to-green-700';
  if (number <= 75) return 'from-purple-500 to-purple-700';
  return 'from-orange-500 to-orange-700';
}

function getSizeClasses(size: 'sm' | 'md' | 'lg' | 'xl'): { container: string; text: string } {
  switch (size) {
    case 'sm':
      return { container: 'w-8 h-8', text: 'text-sm' };
    case 'md':
      return { container: 'w-16 h-16', text: 'text-2xl' };
    case 'lg':
      return { container: 'w-32 h-32', text: 'text-5xl' };
    case 'xl':
      return { container: 'w-64 h-64 md:w-80 md:h-80', text: 'text-8xl md:text-9xl' };
  }
}

export function BingoBall({ number, size = 'md', animate = false, dimmed = false }: BingoBallProps) {
  const colorClass = getBallColor(number);
  const sizeClasses = getSizeClasses(size);

  const ball = (
    <div
      className={`
        ${sizeClasses.container}
        rounded-full
        bg-gradient-to-br ${colorClass}
        flex items-center justify-center
        shadow-lg
        relative
        overflow-hidden
        ${dimmed ? 'opacity-30 grayscale' : ''}
      `}
    >
      {/* Glossy highlight */}
      <div className="absolute top-1 left-1/4 w-1/3 h-1/4 bg-white/40 rounded-full blur-sm" />

      {/* Number */}
      <span className={`${sizeClasses.text} font-bold text-white drop-shadow-lg relative z-10`}>
        {number}
      </span>
    </div>
  );

  if (!animate) return ball;

  return (
    <motion.div
      initial={{ y: -300, opacity: 0, scale: 0.5, rotateX: 180 }}
      animate={{
        y: 0,
        opacity: 1,
        scale: 1,
        rotateX: 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
        duration: 0.8,
      }}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {ball}
      </motion.div>
    </motion.div>
  );
}
