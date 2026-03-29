import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import translations from '../i18n/translations';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [screen, setScreen] = useState('splash'); // splash | menu | options | difficulty | game | victory
  const [lang, setLang] = useState('de');
  const [brightness, setBrightness] = useState(80);
  const [volume, setVolume] = useState(70);
  const [musicOn, setMusicOn] = useState(true);
  const [difficulty, setDifficulty] = useState(null); // easy | medium | nightmare

  // In-game HUD state (updated from Phaser)
  const [hp, setHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  const [armor, setArmor] = useState(0);
  const [coins, setCoins] = useState(0);
  const [wave, setWave] = useState(1);
  const [weapon, setWeapon] = useState('fist');
  const [ammo, setAmmo] = useState(0);
  const [parryCooldown, setParryCooldown] = useState(0);
  const [blockCharges, setBlockCharges] = useState(5);
  const [isDead, setIsDead] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [waveText, setWaveText] = useState('');
  const [easterEgg, setEasterEgg] = useState('');
  const [showShop, setShowShop] = useState(false);
  const [multiplayerRoom, setMultiplayerRoom] = useState(null);
  const [multiplayerPlayers, setMultiplayerPlayers] = useState([]);

  const phaserGameRef = useRef(null);

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  }, [lang]);

  const startGame = useCallback((diff) => {
    setDifficulty(diff);
    const maxHpVal = diff === 'nightmare' ? 80 : 100;
    setMaxHp(maxHpVal);
    setHp(maxHpVal);
    setArmor(0);
    setCoins(0);
    setWave(1);
    setWeapon(diff === 'easy' ? 'iron_sword' : 'fist');
    setAmmo(0);
    setParryCooldown(0);
    setBlockCharges(5);
    setIsDead(false);
    setIsPaused(false);
    setWaveText('');
    setScreen('game');
  }, []);

  const returnToMenu = useCallback(() => {
    if (phaserGameRef.current) {
      phaserGameRef.current.destroy(true);
      phaserGameRef.current = null;
    }
    setScreen('menu');
    setIsDead(false);
    setIsPaused(false);
  }, []);

  const value = {
    screen, setScreen,
    lang, setLang,
    brightness, setBrightness,
    volume, setVolume,
    musicOn, setMusicOn,
    difficulty, setDifficulty,
    hp, setHp, maxHp, setMaxHp,
    armor, setArmor,
    coins, setCoins,
    wave, setWave,
    weapon, setWeapon,
    ammo, setAmmo,
    parryCooldown, setParryCooldown,
    blockCharges, setBlockCharges,
    isDead, setIsDead,
    isPaused, setIsPaused,
    waveText, setWaveText,
    easterEgg, setEasterEgg,
    showShop, setShowShop,
    multiplayerRoom, setMultiplayerRoom,
    multiplayerPlayers, setMultiplayerPlayers,
    phaserGameRef,
    t, startGame, returnToMenu,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  return useContext(GameContext);
}
