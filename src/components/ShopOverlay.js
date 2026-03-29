import { useGame } from '../contexts/GameContext';

const SHOP_ITEMS = [
  { id: 'heal',          name: '❤️ Volle HP',        cost: 10, desc: 'Heilt komplett' },
  { id: 'armor',         name: '🛡️ Volle Rüstung',  cost: 12, desc: 'Rüstung auf 50' },
  { id: 'iron_axe',      name: '🪓 Eisenaxt',        cost: 15, desc: '28 Schaden, Nahkampf' },
  { id: 'diamond_sword', name: '💎 Diamantschwert',  cost: 25, desc: '35 Schaden, Nahkampf' },
  { id: 'pistol',        name: '🔫 Pistole',         cost: 20, desc: '30 Schaden, 20 Schuss' },
  { id: 'shotgun',       name: '💥 Shotgun',         cost: 30, desc: '40 Schaden, 8 Schuss' },
  { id: 'crossbow',      name: '🏹 Armbrust',        cost: 18, desc: '25 Schaden, 15 Bolzen' },
  { id: 'extra_blocks',  name: '🧱 +5 Block',        cost: 8,  desc: 'Extra Blockladungen' },
];

export default function ShopOverlay({ coins, onBuy, onClose, wave }) {
  const { t } = useGame();

  return (
    <div className="absolute inset-0 z-50 bg-black/75 flex items-center justify-center">
      <div className="bg-cave-mid/95 border-2 border-cave-gold/50 rounded-xl p-4 md:p-6 w-[92%] max-w-lg max-h-[85vh] overflow-y-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-pixel text-cave-gold text-sm">⛏️ Shop</h3>
            <p className="font-pixel text-[7px] text-white/40 mt-0.5">Nach Welle {wave}</p>
          </div>
          <div className="font-pixel text-cave-gold text-xs bg-black/30 px-3 py-1 rounded">
            🪙 {coins}
          </div>
        </div>

        {/* Items grid */}
        <div className="grid grid-cols-2 gap-2">
          {SHOP_ITEMS.map((item) => {
            const canAfford = coins >= item.cost;
            return (
              <button
                key={item.id}
                onClick={() => canAfford && onBuy(item.id, item.cost)}
                disabled={!canAfford}
                className={`text-left p-3 rounded-lg border-2 transition-all ${
                  canAfford
                    ? 'bg-cave-dark/60 border-cave-gold/30 hover:border-cave-gold/70 hover:bg-cave-dark/80 active:scale-95'
                    : 'bg-cave-dark/30 border-white/5 opacity-40'
                }`}
              >
                <div className="font-pixel text-[9px] text-white mb-1">{item.name}</div>
                <div className="font-pixel text-[7px] text-white/40 mb-2">{item.desc}</div>
                <div className={`font-pixel text-[8px] ${canAfford ? 'text-cave-gold' : 'text-cave-accent'}`}>
                  🪙 {item.cost}
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue button */}
        <button
          onClick={onClose}
          className="w-full mt-4 font-pixel text-[10px] text-white py-3 bg-cave-accent/70 hover:bg-cave-accent border-2 border-cave-accent rounded-lg transition-all hover:scale-[1.02] active:scale-95"
        >
          ▶ Weiter zur nächsten Welle
        </button>
      </div>
    </div>
  );
}
