import { useGame } from '../contexts/GameContext';

export default function ActionButtons({ onAttack, onBlock, onJump, parryCooldown }) {
  const { blockCharges } = useGame();

  return (
    <div className="fixed bottom-4 right-3 z-30 flex items-end gap-2">
      {/* Jump */}
      <div className="flex flex-col items-center mb-1">
        <button
          onTouchStart={(e) => { e.preventDefault(); onJump(); }}
          onMouseDown={onJump}
          className="action-btn"
          style={{ background: 'rgba(74, 222, 128, 0.35)', width: 56, height: 56 }}
        >
          ⬆️
        </button>
        <span className="font-pixel text-[6px] text-white/30 mt-0.5">Jump</span>
      </div>

      {/* Block / Parry */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <button
            onTouchStart={(e) => { e.preventDefault(); onBlock(); }}
            onMouseDown={onBlock}
            className={`action-btn block ${parryCooldown > 0 ? '' : 'ring-2 ring-cave-gold/50'}`}
          >
            🛡️
          </button>
          {parryCooldown > 0 && (
            <span className="absolute -top-2 -right-2 font-pixel text-[7px] bg-cave-dark text-cave-accent px-1 rounded">
              {parryCooldown}s
            </span>
          )}
        </div>
        <span className="font-pixel text-[6px] text-white/40 mt-0.5">{blockCharges}/5</span>
      </div>

      {/* Attack */}
      <div className="flex flex-col items-center">
        <button
          onTouchStart={(e) => { e.preventDefault(); onAttack(); }}
          onMouseDown={onAttack}
          className="action-btn attack"
        >
          👊
        </button>
        <span className="font-pixel text-[6px] text-white/30 mt-0.5">ATK</span>
      </div>
    </div>
  );
}
