import { useGame } from '../contexts/GameContext';

export default function VictoryScreen() {
  const { returnToMenu, coins, t } = useGame();

  return (
    <div className="w-full h-full flex items-center justify-center bg-cave-dark relative overflow-hidden">
      {/* Particle celebration */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ['#f5c542', '#e94560', '#4ade80', '#60a5fa'][i % 4],
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1.5 + Math.random() * 2}s`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      <div className="text-center relative z-10">
        <div className="text-6xl mb-4">🏆</div>
        <h1 className="font-pixel text-cave-gold text-2xl md:text-4xl mb-2 animate-pulse-slow">
          {t('victory')}
        </h1>
        <p className="font-pixel text-white/60 text-[10px] mb-6">
          {t('victoryDesc')}
        </p>
        <p className="font-pixel text-cave-gold text-sm mb-8">
          🪙 {coins} {t('coins')}
        </p>

        <button
          onClick={returnToMenu}
          className="font-pixel text-white text-[10px] px-8 py-3 bg-cave-accent/80 hover:bg-cave-accent border-2 border-cave-accent rounded-lg transition-all hover:scale-105 active:scale-95"
        >
          {t('backToMenu')}
        </button>
      </div>
    </div>
  );
}
