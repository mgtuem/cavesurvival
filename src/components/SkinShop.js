import { useGame, SKINS } from '../contexts/GameContext';

function SkinPreview({ skin, size = 60 }) {
  const s = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      {/* Helmet */}
      <rect x={s*2} y={s*0.5} width={s*4} height={s*1.2} fill={`#${skin.helmet.toString(16).padStart(6,'0')}`} />
      <rect x={s*2} y={s*0.5} width={s*1.2} height={s*2.5} fill={`#${skin.helmet.toString(16).padStart(6,'0')}`} />
      <rect x={s*4.8} y={s*0.5} width={s*1.2} height={s*2.5} fill={`#${skin.helmet.toString(16).padStart(6,'0')}`} />
      {/* Head */}
      <rect x={s*2.5} y={s*1.5} width={s*3} height={s*2.5} fill={`#${skin.head.toString(16).padStart(6,'0')}`} />
      {/* Eyes */}
      <rect x={s*2.8} y={s*2} width={s*0.7} height={s*0.7} fill="#000" />
      <rect x={s*4.5} y={s*2} width={s*0.7} height={s*0.7} fill="#000" />
      {/* Body */}
      <rect x={s*2.5} y={s*4} width={s*3} height={s*2.5} fill={`#${skin.body.toString(16).padStart(6,'0')}`} />
      {/* Legs */}
      <rect x={s*2.5} y={s*6.5} width={s*1.2} height={s*1.5} fill={`#${skin.legs.toString(16).padStart(6,'0')}`} />
      <rect x={s*4.3} y={s*6.5} width={s*1.2} height={s*1.5} fill={`#${skin.legs.toString(16).padStart(6,'0')}`} />
      {/* Arms */}
      <rect x={s*1} y={s*4} width={s*1.2} height={s*2.3} fill={`#${skin.head.toString(16).padStart(6,'0')}`} />
      <rect x={s*5.8} y={s*4} width={s*1.2} height={s*2.3} fill={`#${skin.head.toString(16).padStart(6,'0')}`} />
    </svg>
  );
}

export default function SkinShop() {
  const { setScreen, ownedSkins, selectedSkin, setSelectedSkin, buySkin, totalCoins, t } = useGame();

  return (
    <div className="w-full h-full flex items-center justify-center bg-cave-dark">
      <div className="bg-cave-mid/90 border-2 border-cave-light rounded-xl p-5 w-[92%] max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-pixel text-white text-sm">🎨 Skins</h2>
          <div className="font-pixel text-[9px] text-cave-gold bg-black/30 px-3 py-1 rounded">
            🪙 {totalCoins}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {SKINS.map((skin) => {
            const owned = ownedSkins.includes(skin.id);
            const selected = selectedSkin === skin.id;
            const canAfford = totalCoins >= skin.cost;

            return (
              <div key={skin.id}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selected ? 'border-cave-gold bg-cave-gold/10' :
                  owned ? 'border-cave-green/40 bg-cave-dark/50' :
                  'border-white/10 bg-cave-dark/30'
                }`}>
                <div className="flex items-center gap-2">
                  <SkinPreview skin={skin} size={48} />
                  <div className="flex-1 min-w-0">
                    <p className="font-pixel text-[8px] text-white truncate">{skin.name}</p>
                    {owned ? (
                      selected ? (
                        <span className="font-pixel text-[7px] text-cave-gold">✓ Ausgewählt</span>
                      ) : (
                        <button
                          onClick={() => setSelectedSkin(skin.id)}
                          className="font-pixel text-[7px] text-cave-green hover:text-white transition-colors"
                        >
                          Auswählen
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => buySkin(skin.id)}
                        disabled={!canAfford}
                        className={`font-pixel text-[7px] ${
                          canAfford ? 'text-cave-gold hover:text-white' : 'text-white/20'
                        } transition-colors`}
                      >
                        🪙 {skin.cost}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={() => setScreen('menu')}
          className="font-pixel text-white/80 text-[10px] mt-4 w-full py-3 bg-cave-dark/60 hover:bg-cave-dark border-2 border-cave-light/40 rounded-lg transition-all">
          {t('back')}
        </button>
      </div>
    </div>
  );
}
