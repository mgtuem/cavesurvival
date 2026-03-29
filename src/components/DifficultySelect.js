import { useGame } from '../contexts/GameContext';

const DIFFICULTIES = [
  { key: 'easy', color: 'cave-green', border: 'border-green-500', bg: 'bg-green-500/20' },
  { key: 'medium', color: 'cave-gold', border: 'border-yellow-500', bg: 'bg-yellow-500/20' },
  { key: 'nightmare', color: 'cave-accent', border: 'border-red-500', bg: 'bg-red-500/20' },
];

export default function DifficultySelect() {
  const { setScreen, startGame, t } = useGame();

  return (
    <div className="w-full h-full flex items-center justify-center bg-cave-dark">
      <div className="text-center w-[90%] max-w-lg">
        <h2 className="font-pixel text-white text-base md:text-xl mb-8">
          {t('selectDifficulty')}
        </h2>

        <div className="space-y-3">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              onClick={() => startGame(d.key)}
              className={`w-full font-pixel text-left px-5 py-4 ${d.bg} ${d.border} border-2 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white text-sm">{t(d.key)}</span>
                <span className="text-white/30 text-[8px]">▶</span>
              </div>
              <p className="text-white/50 text-[8px] mt-1">{t(d.key + 'Desc')}</p>
            </button>
          ))}
        </div>

        <button
          onClick={() => setScreen('menu')}
          className="font-pixel text-white/50 text-[10px] mt-6 hover:text-white/80 transition-colors"
        >
          {t('back')}
        </button>
      </div>
    </div>
  );
}
