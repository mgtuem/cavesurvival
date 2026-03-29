import { useGame } from '../contexts/GameContext';

const LANGS = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
];

export default function OptionsMenu() {
  const {
    setScreen, t,
    brightness, setBrightness,
    volume, setVolume,
    musicOn, setMusicOn,
    lang, setLang,
  } = useGame();

  return (
    <div className="w-full h-full flex items-center justify-center bg-cave-dark">
      <div className="bg-cave-mid/90 backdrop-blur border-2 border-cave-light rounded-xl p-6 md:p-8 w-[90%] max-w-md">
        <h2 className="font-pixel text-white text-base md:text-lg text-center mb-6">
          {t('options')}
        </h2>

        <div className="space-y-5">
          {/* Brightness */}
          <div>
            <label className="font-pixel text-white/70 text-[10px] block mb-1">
              {t('brightness')}: {brightness}
            </label>
            <input
              type="range"
              min={10}
              max={100}
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Volume */}
          <div>
            <label className="font-pixel text-white/70 text-[10px] block mb-1">
              {t('volume')}: {volume}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Music Toggle */}
          <div className="flex items-center justify-between">
            <span className="font-pixel text-white/70 text-[10px]">{t('music')}</span>
            <button
              onClick={() => setMusicOn(!musicOn)}
              className={`font-pixel text-[10px] px-4 py-2 rounded border-2 transition-all ${
                musicOn
                  ? 'bg-cave-green/30 border-cave-green text-cave-green'
                  : 'bg-cave-accent/30 border-cave-accent text-cave-accent'
              }`}
            >
              {musicOn ? t('on') : t('off')}
            </button>
          </div>

          {/* Language */}
          <div>
            <label className="font-pixel text-white/70 text-[10px] block mb-2">
              {t('language')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`font-pixel text-[9px] py-2 rounded border-2 transition-all ${
                    lang === l.code
                      ? 'bg-cave-accent/40 border-cave-accent text-white'
                      : 'bg-cave-dark/50 border-cave-light/50 text-white/60 hover:border-white/40'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => setScreen('menu')}
          className="font-pixel text-white/80 text-[10px] mt-6 w-full py-3 bg-cave-dark/60 hover:bg-cave-dark border-2 border-cave-light/40 rounded-lg transition-all"
        >
          {t('back')}
        </button>
      </div>
    </div>
  );
}
