'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { BingoBall } from '@/components/BingoBall';
import { NumberGrid } from '@/components/NumberGrid';

export default function ControlPage() {
  const { gameState, isConnected, revealNumber, toggleIntermission, declareWinner, newGame } = useSocket();
  const { phase, calledNumbers } = gameState;

  const [stagedNumber, setStagedNumber] = useState<number | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  const remainingNumbers = Array.from({ length: 90 }, (_, i) => i + 1)
    .filter(n => !calledNumbers.includes(n));

  const handleDraw = () => {
    if (remainingNumbers.length === 0) return;
    const randomIndex = Math.floor(Math.random() * remainingNumbers.length);
    setStagedNumber(remainingNumbers[randomIndex]);
  };

  const handleReveal = () => {
    if (stagedNumber === null) return;
    revealNumber(stagedNumber);
    setStagedNumber(null);
  };

  const handleManualSelect = (number: number) => {
    setStagedNumber(number);
  };

  const handleConfirmWinner = () => {
    declareWinner();
    setShowWinnerModal(false);
  };

  const handleNewGame = () => {
    newGame();
    setStagedNumber(null);
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <p className="text-xl text-white">Conectando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 pb-24">
      {/* Staged Number Preview */}
      <div className="flex flex-col items-center mb-6">
        <p className="text-sm text-slate-400 mb-2">
          {stagedNumber ? 'Próximo número' : 'Toque em Sortear'}
        </p>
        <div className="h-24 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {stagedNumber && (
              <motion.div
                key={stagedNumber}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
              >
                <BingoBall number={stagedNumber} size="lg" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 mb-6">
        {phase !== 'winner' && (
          <>
            <button
              onClick={handleDraw}
              disabled={remainingNumbers.length === 0}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl font-bold text-xl transition-colors"
            >
              Sortear
            </button>

            <AnimatePresence>
              {stagedNumber && (
                <motion.button
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onClick={handleReveal}
                  className="w-full py-4 bg-green-500 hover:bg-green-600 rounded-xl font-bold text-xl transition-colors"
                >
                  Revelar
                </motion.button>
              )}
            </AnimatePresence>

            <button
              onClick={toggleIntermission}
              className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                phase === 'intermission'
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              {phase === 'intermission' ? 'Voltar ao Jogo' : 'Intervalo'}
            </button>
          </>
        )}

        {phase === 'winner' && (
          <button
            onClick={handleNewGame}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 rounded-xl font-bold text-xl transition-colors"
          >
            Novo Jogo
          </button>
        )}
      </div>

      {/* Number Grid */}
      <div className="mb-6">
        <p className="text-sm text-slate-400 mb-2 text-center">
          Toque para selecionar manualmente
        </p>
        <NumberGrid
          calledNumbers={calledNumbers}
          onNumberClick={handleManualSelect}
          interactive={phase !== 'winner'}
        />
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-4 flex items-center justify-between">
        <span className="text-slate-400">
          Sorteados: {calledNumbers.length}/90
        </span>
        {phase !== 'winner' && (
          <button
            onClick={() => setShowWinnerModal(true)}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-colors"
          >
            Vencedor!
          </button>
        )}
      </div>

      {/* Winner Confirmation Modal */}
      <AnimatePresence>
        {showWinnerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
            onClick={() => setShowWinnerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm"
            >
              <h2 className="text-2xl font-bold text-center mb-4">
                Confirmar vencedor?
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWinnerModal(false)}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmWinner}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-600 rounded-xl font-semibold transition-colors"
                >
                  Sim
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
