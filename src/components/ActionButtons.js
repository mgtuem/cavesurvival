import { useGame } from '../contexts/GameContext';

const WEAPON_ICONS = {
  fist:'👊', iron_sword:'⚔️', iron_axe:'🪓', diamond_sword:'💎', pistol:'🔫', shotgun:'💥', crossbow:'🏹'
};

export default function ActionButtons({ onAttack, onBlock, onJump, onSwitch, parryCooldown }) {
  const { blockCharges, buttonSize, inventory, weapon } = useGame();
  const sz = buttonSize || 64;
  const fs = Math.max(16, Math.round(sz * 0.38));

  const btnStyle = (bg) => ({
    width: sz, height: sz, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: fs, color: 'white', backdropFilter: 'blur(4px)',
    background: bg, touchAction: 'manipulation', userSelect: 'none',
  });

  return (
    <div className="fixed bottom-4 right-3 z-30 flex items-end gap-2">
      {/* Jump */}
      <div className="flex flex-col items-center">
        <button
          onTouchStart={(e) => { e.preventDefault(); onJump(); }}
          onMouseDown={onJump}
          style={btnStyle('rgba(74,222,128,0.35)')}
        >⬆️</button>
        <span className="font-pixel text-[5px] text-white/30 mt-0.5">Jump</span>
      </div>

      {/* Weapon Switch */}
      {inventory && inventory.length > 0 && (
        <div className="flex flex-col items-center">
          <button
            onTouchStart={(e) => { e.preventDefault(); onSwitch(); }}
            onMouseDown={onSwitch}
            style={btnStyle('rgba(245,197,66,0.3)')}
          >🔄</button>
          <span className="font-pixel text-[5px] text-cave-gold mt-0.5">
            {WEAPON_ICONS[weapon] || '👊'}
          </span>
        </div>
      )}

      {/* Block / Parry */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <button
            onTouchStart={(e) => { e.preventDefault(); onBlock(); }}
            onMouseDown={onBlock}
            style={{
              ...btnStyle('rgba(96,165,250,0.4)'),
              boxShadow: parryCooldown <= 0 ? '0 0 8px rgba(245,197,66,0.4)' : 'none',
            }}
          >🛡️</button>
          {parryCooldown > 0 && (
            <span className="absolute -top-2 -right-2 font-pixel text-[7px] bg-cave-dark text-cave-accent px-1 rounded">
              {parryCooldown}s
            </span>
          )}
        </div>
        <span className="font-pixel text-[5px] text-white/40 mt-0.5">{blockCharges}/5</span>
      </div>

      {/* Attack */}
      <div className="flex flex-col items-center">
        <button
          onTouchStart={(e) => { e.preventDefault(); onAttack(); }}
          onMouseDown={onAttack}
          style={btnStyle('rgba(233,69,96,0.4)')}
        >👊</button>
        <span className="font-pixel text-[5px] text-white/30 mt-0.5">ATK</span>
      </div>
    </div>
  );
}
