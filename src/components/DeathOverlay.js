import { useEffect, useState } from 'react';
import { useGame } from '../contexts/GameContext';

export default function DeathOverlay({ coins, onRevive, onDecline }) {
  const { t } = useGame();
  const [countdown, setCountdown] = useState(5);
  const canRevive = coins >= 50;

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onDecline]);

  return (
    <div className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-cave-mid/95 border-2 border-cave-accent rounded-xl p-6 w-[85%] max-w-sm text-center relative">
        {/* Close button */}
        <button
          onClick={onDecline}
          className="absolute top-2 right-3 font-pixel text-white/50 hover:text-white text-base"
        >
          ✕
        </button>

        {/* Skull icon */}
        <div className="text-4xl mb-3">💀</div>

        <h3 className="font-pixel text-cave-accent text-sm mb-4">
          {t('continuePlay')}
        </h3>

        {/* Revive option */}
        {canRevive ? (
          <button
            onClick={onRevive}
            className="w-full font-pixel text-[10px] bg-cave-gold/20 border-2 border-cave-gold text-cave-gold py-3 rounded-lg hover:bg-cave-gold/30 transition-all mb-3"
          >
            <span className="text-lg block mb-1">🗡️</span>
            {t('reviveFor')} 50 🪙
            <span className="block text-[8px] text-cave-gold/60 mt-1">{t('reviveDesc')}</span>
          </button>
        ) : (
          <div className="font-pixel text-[9px] text-white/40 mb-3 py-3 border border-white/10 rounded-lg">
            {t('reviveFor')} 50 🪙
            <span className="block text-cave-accent mt-1">({coins} 🪙)</span>
          </div>
        )}

        {/* Timer */}
        <p className="font-pixel text-[8px] text-white/30">
          {t('waitingReturn')} {countdown}s
        </p>
      </div>
    </div>
  );
}
