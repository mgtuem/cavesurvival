import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import translations from '../i18n/translations';

const GameContext = createContext(null);

// Skin definitions
export const SKINS = [
  { id: 'steve',     name: 'Steve',         cost: 0,   head: 0xc4a44a, body: 0x60a5fa, legs: 0x3b3b8a, helmet: 0x60a5fa },
  { id: 'alex',      name: 'Alex',          cost: 0,   head: 0xd4a45a, body: 0x4ade80, legs: 0x3b6b3a, helmet: 0x4ade80 },
  { id: 'knight',    name: 'Ritter',        cost: 30,  head: 0xc0c0c0, body: 0x808080, legs: 0x606060, helmet: 0xc0c0c0 },
  { id: 'ninja',     name: 'Ninja',         cost: 40,  head: 0x222222, body: 0x333333, legs: 0x222222, helmet: 0x111111 },
  { id: 'lava',      name: 'Lava Lord',     cost: 60,  head: 0xff6b35, body: 0xcc3300, legs: 0x991100, helmet: 0xff4400 },
  { id: 'ice',       name: 'Frost King',    cost: 60,  head: 0xaaddff, body: 0x77bbee, legs: 0x5599cc, helmet: 0x88ccff },
  { id: 'gold',      name: 'Gold Steve',    cost: 80,  head: 0xffd700, body: 0xdaa520, legs: 0xb8860b, helmet: 0xffd700 },
  { id: 'ender',     name: 'Enderman',      cost: 100, head: 0x2d002d, body: 0x1a001a, legs: 0x110011, helmet: 0x440044 },
  { id: 'diamond',   name: 'Diamond Steve', cost: 150, head: 0x00e5ff, body: 0x00bcd4, legs: 0x0097a7, helmet: 0x00e5ff },
  { id: 'ryan',      name: 'Ryan Special',  cost: 200, head: 0xe94560, body: 0xf5c542, legs: 0xe94560, helmet: 0xf5c542 },
];

export function GameProvider({ children }) {
  const [screen, setScreen] = useState('splash');
  const [lang, setLang] = useState('de');
  const [brightness, setBrightness] = useState(80);
  const [volume, setVolume] = useState(70);
  const [musicOn, setMusicOn] = useState(true);
  const [difficulty, setDifficulty] = useState(null);
  const [gameMode, setGameMode] = useState('survival'); // survival | pvp
  const [buttonSize, setButtonSize] = useState(64); // pixels, 48-96

  // Skins
  const [ownedSkins, setOwnedSkins] = useState(['steve', 'alex']);
  const [selectedSkin, setSelectedSkin] = useState('steve');

  // Persistent coins (across games)
  const [totalCoins, setTotalCoins] = useState(0);

  // In-game HUD state
  const [hp, setHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  const [armor, setArmor] = useState(0);
  const [coins, setCoins] = useState(0);
  const [wave, setWave] = useState(1);
  const [weapon, setWeapon] = useState('fist');
  const [ammo, setAmmo] = useState(0);
  const [inventory, setInventory] = useState([]); // [{type, ammo?}]
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
  const multiplayerRef = useRef(null);

  // Load saved data from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cavesurvival_save');
      if (saved) {
        const d = JSON.parse(saved);
        if (d.totalCoins) setTotalCoins(d.totalCoins);
        if (d.ownedSkins) setOwnedSkins(d.ownedSkins);
        if (d.selectedSkin) setSelectedSkin(d.selectedSkin);
        if (d.buttonSize) setButtonSize(d.buttonSize);
        if (d.lang) setLang(d.lang);
        if (d.volume !== undefined) setVolume(d.volume);
        if (d.brightness !== undefined) setBrightness(d.brightness);
      }
    } catch (e) {}
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem('cavesurvival_save', JSON.stringify({
        totalCoins, ownedSkins, selectedSkin, buttonSize, lang, volume, brightness,
      }));
    } catch (e) {}
  }, [totalCoins, ownedSkins, selectedSkin, buttonSize, lang, volume, brightness]);

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
    const startWep = diff === 'easy' ? 'iron_sword' : 'fist';
    setWeapon(startWep);
    setAmmo(0);
    setInventory(startWep !== 'fist' ? [{ type: startWep }] : []);
    setParryCooldown(0);
    setBlockCharges(5);
    setIsDead(false);
    setIsPaused(false);
    setWaveText('');
    setEasterEgg('');
    setShowShop(false);
    setScreen('game');
  }, []);

  const returnToMenu = useCallback(() => {
    if (phaserGameRef.current) {
      phaserGameRef.current.destroy(true);
      phaserGameRef.current = null;
    }
    // Add earned coins to total
    setTotalCoins((prev) => prev + coins);
    setScreen('menu');
    setIsDead(false);
    setIsPaused(false);
  }, [coins]);

  const buySkin = useCallback((skinId) => {
    const skin = SKINS.find((s) => s.id === skinId);
    if (!skin || ownedSkins.includes(skinId) || totalCoins < skin.cost) return false;
    setTotalCoins((prev) => prev - skin.cost);
    setOwnedSkins((prev) => [...prev, skinId]);
    return true;
  }, [ownedSkins, totalCoins]);

  const value = {
    screen, setScreen,
    lang, setLang,
    brightness, setBrightness,
    volume, setVolume,
    musicOn, setMusicOn,
    difficulty, setDifficulty,
    gameMode, setGameMode,
    buttonSize, setButtonSize,
    ownedSkins, selectedSkin, setSelectedSkin, buySkin, totalCoins, setTotalCoins,
    hp, setHp, maxHp, setMaxHp,
    armor, setArmor,
    coins, setCoins,
    wave, setWave,
    weapon, setWeapon,
    ammo, setAmmo,
    inventory, setInventory,
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
    multiplayerRef,
    t, startGame, returnToMenu,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  return useContext(GameContext);
}
