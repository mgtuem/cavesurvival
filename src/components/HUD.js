import { useGame } from '../contexts/GameContext';

const WEAPON_LABELS = {
  fist: '👊',
  iron_sword: '⚔️',
  iron_axe: '🪓',
  diamond_sword: '💎⚔️',
  pistol: '🔫',
};

export default function HUD() {
  const { hp, maxHp, armor, coins, wave, weapon, ammo, t } = useGame();

  const hpPct = Math.max(0, (hp / maxHp) * 100);
  const armorPct = Math.max(0, (armor / 50) * 100);
  const hpColor = hpPct > 50 ? 'bg-cave-green' : hpPct > 25 ? 'bg-yellow-500' : 'bg-cave-accent';

  return (
    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 pt-2">
        {/* Wave */}
        <div className="font-pixel text-[9px] text-cave-gold bg-black/40 px-3 py-1 rounded">
          {t('wave')} {wave}/5
        </div>

        {/* Coins */}
        <div className="font-pixel text-[9px] text-cave-gold bg-black/40 px-3 py-1 rounded">
          🪙 {coins}
        </div>

        {/* Weapon */}
        <div className="font-pixel text-[9px] text-white bg-black/40 px-3 py-1 rounded">
          {WEAPON_LABELS[weapon] || '👊'}
          {weapon === 'pistol' && <span className="ml-1 text-cave-accent">{ammo}</span>}
        </div>
      </div>

      {/* Bottom-left HP/Armor */}
      <div className="absolute bottom-16 left-3 w-36">
        {/* HP Bar */}
        <div className="mb-1">
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-pixel text-[7px] text-cave-green">{t('hp')}</span>
            <span className="font-pixel text-[7px] text-white/60">{hp}/{maxHp}</span>
          </div>
          <div className="w-full h-3 bg-black/50 rounded-sm overflow-hidden border border-white/10">
            <div
              className={`h-full ${hpColor} transition-all duration-200`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
        </div>

        {/* Armor Bar */}
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-pixel text-[7px] text-cave-blue">{t('armor')}</span>
            <span className="font-pixel text-[7px] text-white/60">{armor}/50</span>
          </div>
          <div className="w-full h-2.5 bg-black/50 rounded-sm overflow-hidden border border-white/10">
            <div
              className="h-full bg-cave-blue transition-all duration-200"
              style={{ width: `${armorPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
