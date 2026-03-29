import { useEffect, useRef, useState, useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import HUD from './HUD';
import Joystick from './Joystick';
import ActionButtons from './ActionButtons';
import DeathOverlay from './DeathOverlay';
import ShopOverlay from './ShopOverlay';

export default function GameWrapper() {
  const gameCtx = useGame();
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let game = null;
    let cancelled = false;

    const initPhaser = async () => {
      if (typeof window === 'undefined') return;
      const Phaser = (await import('phaser')).default;
      const { default: GameScene } = await import('../game/scenes/GameScene');
      if (cancelled || !containerRef.current) return;

      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerRef.current,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: '#1a1a2e',
        physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
        scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene: [],
        render: { pixelArt: true, antialias: false },
        input: { touch: { capture: false } },
      });

      const scene = new GameScene();
      game.scene.add('GameScene', scene, true, {
        gameCtx,
        difficulty: gameCtx.difficulty,
        gameMode: gameCtx.gameMode,
        selectedSkin: gameCtx.selectedSkin,
        multiplayerMgr: null,
      });

      sceneRef.current = scene;
      gameCtx.phaserGameRef.current = game;
      setReady(true);
    };

    initPhaser();
    return () => {
      cancelled = true;
      if (game) { game.destroy(true); gameCtx.phaserGameRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJoystick = useCallback((x, y) => {
    if (sceneRef.current) sceneRef.current.setJoystick(x, y);
  }, []);
  const handleAttack = useCallback(() => {
    if (sceneRef.current) sceneRef.current.doAttack();
  }, []);
  const handleBlock = useCallback(() => {
    if (sceneRef.current) sceneRef.current.doBlock();
  }, []);
  const handleJump = useCallback(() => {
    if (sceneRef.current) sceneRef.current.doJump();
  }, []);
  const handleSwitch = useCallback(() => {
    if (sceneRef.current) sceneRef.current.switchWeapon();
  }, []);
  const handleRevive = useCallback(() => {
    if (sceneRef.current && gameCtx.coins >= 50) sceneRef.current.revivePlayer();
  }, [gameCtx.coins]);
  const handleShopBuy = useCallback((item, cost) => {
    if (sceneRef.current && gameCtx.coins >= cost) {
      sceneRef.current.playerCoins -= cost;
      sceneRef.current.shopBuy(item);
    }
  }, [gameCtx.coins]);
  const handleShopClose = useCallback(() => {
    gameCtx.setShowShop(false);
    if (sceneRef.current) sceneRef.current.resumeAfterShop();
  }, [gameCtx]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="absolute inset-0 z-0" />
      {ready && (
        <>
          <HUD />
          <Joystick onMove={handleJoystick} />
          <ActionButtons
            onAttack={handleAttack}
            onBlock={handleBlock}
            onJump={handleJump}
            onSwitch={handleSwitch}
            parryCooldown={gameCtx.parryCooldown}
          />
          {gameCtx.isDead && (
            <DeathOverlay coins={gameCtx.coins} onRevive={handleRevive} onDecline={() => gameCtx.returnToMenu()} />
          )}
          {gameCtx.showShop && (
            <ShopOverlay coins={gameCtx.coins} onBuy={handleShopBuy} onClose={handleShopClose} wave={gameCtx.wave} />
          )}
          {gameCtx.waveText && (
            <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
              <div className="font-pixel text-cave-gold text-xl md:text-3xl animate-pulse drop-shadow-lg">{gameCtx.waveText}</div>
            </div>
          )}
          {gameCtx.easterEgg && (
            <div className="absolute inset-0 z-40 flex items-end justify-center pb-28 pointer-events-none">
              <div className="font-pixel text-[10px] md:text-sm text-cave-gold bg-black/60 px-5 py-3 rounded-lg border border-cave-gold/30 animate-float">{gameCtx.easterEgg}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
