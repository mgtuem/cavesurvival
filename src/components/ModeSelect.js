import { useGame } from '../contexts/GameContext';

export default function ModeSelect() {
  const { setScreen, setGameMode, t } = useGame();

  return (
    <div className="w-full h-full flex items-center justify-center bg-cave-dark">
      <div className="text-center w-[90%] max-w-md">
        <h2 className="font-pixel text-white text-base md:text-xl mb-8">
          Spielmodus
        </h2>

        <div className="space-y-3">
          <button
            onClick={() => { setGameMode('survival'); setScreen('difficulty'); }}
            className="w-full font-pixel text-left px-5 py-5 bg-cave-green/15 border-2 border-green-500 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⛏️</span>
              <div>
                <span className="text-white text-sm block">Survival Solo</span>
                <p className="text-white/40 text-[8px] mt-1">5 Wellen überleben · Mobs besiegen · Loot sammeln</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { setGameMode('coop'); setScreen('multiplayer'); }}
            className="w-full font-pixel text-left px-5 py-5 bg-blue-500/15 border-2 border-blue-400 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤝</span>
              <div>
                <span className="text-white text-sm block">Survival Online</span>
                <p className="text-white/40 text-[8px] mt-1">Zusammen mit Freunden · Gemeinsam Wellen überleben</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { setGameMode('pvp'); setScreen('multiplayer'); }}
            className="w-full font-pixel text-left px-5 py-5 bg-cave-accent/15 border-2 border-red-500 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚔️</span>
              <div>
                <span className="text-white text-sm block">PvP</span>
                <p className="text-white/40 text-[8px] mt-1">Online gegen Freunde kämpfen · Letzter überlebt</p>
              </div>
            </div>
          </button>
        </div>

        <button onClick={() => setScreen('menu')}
          className="font-pixel text-white/50 text-[10px] mt-6 hover:text-white/80 transition-colors">
          {t('back')}
        </button>
      </div>
    </div>
  );
}
