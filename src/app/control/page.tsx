'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { BingoBall } from '@/components/BingoBall';
import { NumberGrid } from '@/components/NumberGrid';

function getBackgroundTint(number: number | null): string {
  if (!number) return 'from-slate-900 to-slate-800';
  if (number <= 15) return 'from-blue-950 to-slate-900';
  if (number <= 30) return 'from-red-950 to-slate-900';
  if (number <= 45) return 'from-amber-950 to-slate-900';
  if (number <= 60) return 'from-green-950 to-slate-900';
  if (number <= 75) return 'from-purple-950 to-slate-900';
  return 'from-orange-950 to-slate-900';
}

const triggerHaptic = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(50);
  }
};

export default function ControlPage() {
  const { gameState, isConnected, revealNumber, toggleIntermission, declareWinner, newGame } = useSocket();
  const { phase, calledNumbers } = gameState;

  const [stagedNumber, setStagedNumber] = useState<number | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [showNumberDrawer, setShowNumberDrawer] = useState(false);

  const remainingNumbers = Array.from({ length: 90 }, (_, i) => i + 1)
    .filter(n => !calledNumbers.includes(n));

  const handleDraw = () => {
    if (remainingNumbers.length === 0) return;
    triggerHaptic();
    const randomIndex = Math.floor(Math.random() * remainingNumbers.length);
    setStagedNumber(remainingNumbers[randomIndex]);
  };

  const handleReveal = () => {
    if (stagedNumber === null) return;
    triggerHaptic();
    revealNumber(stagedNumber);
    setStagedNumber(null);
  };

  const handleManualSelect = (number: number) => {
    triggerHaptic();
    setStagedNumber(number);
    setShowNumberDrawer(false);
  };

  const handleConfirmWinner = () => {
    triggerHaptic();
    declareWinner();
    setShowWinnerModal(false);
  };

  const handleNewGame = () => {
    triggerHaptic();
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
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundTint(stagedNumber)} text-white transition-colors duration-500 flex flex-col`}>
      <div className="flex-1 flex flex-col items-center justify-center relative p-6">
        <div className="absolute top-6 right-6">
          <div className="bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <span className="text-sm font-medium text-white/80">
              Sorteados: {calledNumbers.length}/90
            </span>
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          {stagedNumber ? (
            <motion.div
              key={stagedNumber}
              initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotate: 180 }}
              className="relative z-10"
            >
              <BingoBall number={stagedNumber} size="xl" />
              <div className="mt-8 text-center">
                <p className="text-white/50 text-lg font-medium tracking-wide uppercase">Próximo Número</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center opacity-20"
            >
              <div className="w-48 h-48 rounded-full border-4 border-dashed border-white/50 flex items-center justify-center">
                <span className="text-4xl font-bold text-white/50">?</span>
              </div>
              <p className="mt-4 text-xl font-medium">Aguardando sorteio</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl border-t border-white/10 rounded-t-[2.5rem] p-6 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
        
        <div className="flex flex-col gap-4">
          {phase !== 'winner' ? (
            <>
              {stagedNumber ? (
                <button
                  type="button"
                  onClick={handleReveal}
                  className="w-full py-5 bg-green-500 active:bg-green-600 rounded-2xl font-bold text-2xl shadow-lg shadow-green-900/30 transition-all transform active:scale-95 flex items-center justify-center gap-3"
                >
                  <span>Revelar</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDraw}
                  disabled={remainingNumbers.length === 0}
                  className="w-full py-5 bg-amber-500 active:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-500 rounded-2xl font-bold text-2xl shadow-lg shadow-amber-900/30 transition-all transform active:scale-95 flex items-center justify-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span>Sortear</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowNumberDrawer(true)}
                  className="py-4 bg-slate-700 active:bg-slate-600 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Manual
                </button>
                <button
                  type="button"
                  onClick={toggleIntermission}
                  className={`py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 ${
                    phase === 'intermission'
                      ? 'bg-blue-600 active:bg-blue-700 text-white'
                      : 'bg-slate-700 active:bg-slate-600'
                  }`}
                >
                  {phase === 'intermission' ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Voltar
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Intervalo
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowWinnerModal(true)}
                className="mt-2 w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Declarar Vencedor
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleNewGame}
              className="w-full py-5 bg-amber-500 active:bg-amber-600 rounded-2xl font-bold text-2xl shadow-lg transition-colors"
            >
              Novo Jogo
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showNumberDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNumberDrawer(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-slate-900 rounded-t-[2rem] z-50 max-h-[85vh] flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-white/5 flex-shrink-0">
                <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />
                <h3 className="text-center text-xl font-bold text-white">Selecionar Número</h3>
              </div>
              
              <div className="overflow-y-auto p-4 flex-1">
                <NumberGrid
                  calledNumbers={calledNumbers}
                  onNumberClick={handleManualSelect}
                  interactive={phase !== 'winner'}
                />
              </div>

              <div className="p-4 border-t border-white/5 flex-shrink-0 bg-slate-900 pb-8">
                <button
                  type="button"
                  onClick={() => setShowNumberDrawer(false)}
                  className="w-full py-4 bg-slate-800 active:bg-slate-700 rounded-xl font-bold text-lg text-slate-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWinnerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            onClick={() => setShowWinnerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-3xl p-8 w-full max-w-sm border border-white/10 shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-center mb-2">Confirmar Vencedor?</h2>
              <p className="text-slate-400 text-center mb-8">
                Isso encerrará o jogo atual e iniciará a celebração.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWinnerModal(false)}
                  className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmWinner}
                  className="flex-1 py-4 bg-red-500 hover:bg-red-600 rounded-xl font-semibold transition-colors shadow-lg shadow-red-900/20"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}