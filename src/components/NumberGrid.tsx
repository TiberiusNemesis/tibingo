'use client';

import { motion } from 'framer-motion';
import { BingoBall } from './BingoBall';

interface NumberGridProps {
  calledNumbers: number[];
  onNumberClick?: (number: number) => void;
  interactive?: boolean;
}

export function NumberGrid({ calledNumbers, onNumberClick, interactive = false }: NumberGridProps) {
  const numbers = Array.from({ length: 90 }, (_, i) => i + 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-10 gap-1 md:gap-2 p-2 md:p-4"
    >
      {numbers.map((number, index) => {
        const isCalled = calledNumbers.includes(number);

        return (
          <motion.div
            key={number}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.01 }}
            onClick={() => interactive && !isCalled && onNumberClick?.(number)}
            className={interactive && !isCalled ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
          >
            <BingoBall
              number={number}
              size="sm"
              dimmed={!isCalled}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
