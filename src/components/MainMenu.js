import { useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';

function drawMineBackground(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Cave background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0d0d1a');
  grad.addColorStop(0.5, '#1a1a2e');
  grad.addColorStop(1, '#2d2d44');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Stone texture dots
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    ctx.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }

  // Floor
  ctx.fillStyle = '#3d3d5c';
  ctx.fillRect(0, h * 0.75, w, h * 0.25);
  ctx.fillStyle = '#4a4a6a';
  for (let x = 0; x < w; x += 32) {
    ctx.fillRect(x, h * 0.75, 30, 4);
  }

  // Cave openings (left and right)
  const drawCaveOpening = (x, side) => {
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x, h * 0.62, 50, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3d3d5c';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Glow
    const glow = ctx.createRadialGradient(x, h * 0.62, 10, x, h * 0.62, 60);
    glow.addColorStop(0, 'rgba(233, 69, 96, 0.15)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 60, h * 0.45, 120, 200);
  };
  drawCaveOpening(60, 'left');
  drawCaveOpening(w - 60, 'right');

  // Rails on floor
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.82);
  ctx.lineTo(w, h * 0.82);
  ctx.moveTo(0, h * 0.86);
  ctx.lineTo(w, h * 0.86);
  ctx.stroke();
  // Rail ties
  ctx.strokeStyle = '#4b3621';
  ctx.lineWidth = 3;
  for (let x = 0; x < w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, h * 0.80);
    ctx.lineTo(x, h * 0.88);
    ctx.stroke();
  }

  // Draw pixel mobs
  const drawZombie = (x, y, s) => {
    ctx.fillStyle = '#2d5a27'; // green body
    ctx.fillRect(x, y, s * 4, s * 6);
    ctx.fillStyle = '#3d7a37';
    ctx.fillRect(x + s, y, s * 2, s * 2); // head highlight
    ctx.fillStyle = '#000';
    ctx.fillRect(x + s * 0.5, y + s * 0.5, s * 0.6, s * 0.6); // eyes
    ctx.fillRect(x + s * 2.5, y + s * 0.5, s * 0.6, s * 0.6);
    ctx.fillStyle = '#1a3d18';
    ctx.fillRect(x, y + s * 2, s * 4, s * 0.5); // shirt line
    // Arms
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(x - s, y + s * 2, s, s * 3);
    ctx.fillRect(x + s * 4, y + s * 2, s, s * 3);
  };

  const drawSkeleton = (x, y, s) => {
    ctx.fillStyle = '#d4d4d4'; // white bones
    ctx.fillRect(x + s, y, s * 2, s * 2); // skull
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x + s * 1.2, y + s * 0.5, s * 0.4, s * 0.4); // eyes
    ctx.fillRect(x + s * 2.2, y + s * 0.5, s * 0.4, s * 0.4);
    ctx.fillStyle = '#b0b0b0';
    ctx.fillRect(x + s * 1.2, y + s * 2, s * 1.6, s * 3); // ribcage
    ctx.fillStyle = '#d4d4d4';
    ctx.fillRect(x, y + s * 2.5, s, s * 2.5); // arm
    // Bow
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + s * 4.5, y + s * 3, s * 1.5, -0.8, 0.8);
    ctx.stroke();
  };

  const drawCreeper = (x, y, s) => {
    ctx.fillStyle = '#3daa3d'; // green body
    ctx.fillRect(x, y, s * 4, s * 6);
    ctx.fillStyle = '#2d8a2d';
    ctx.fillRect(x + s, y, s * 2, s * 2); // darker face
    ctx.fillStyle = '#000';
    // Creeper face pattern
    ctx.fillRect(x + s * 0.5, y + s * 0.5, s, s);
    ctx.fillRect(x + s * 2.5, y + s * 0.5, s, s);
    ctx.fillRect(x + s * 1, y + s * 1.5, s * 2, s);
    ctx.fillRect(x + s * 1.5, y + s * 2.5, s, s * 0.5);
  };

  const s = Math.max(4, w / 120);
  drawZombie(w * 0.2, h * 0.55, s);
  drawZombie(w * 0.65, h * 0.58, s);
  drawSkeleton(w * 0.35, h * 0.52, s);
  drawSkeleton(w * 0.8, h * 0.56, s);
  drawCreeper(w * 0.5, h * 0.54, s);
  drawCreeper(w * 0.12, h * 0.57, s);

  // Ore veins on walls
  const drawOre = (ox, oy, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox, oy, 6, 6);
    ctx.fillRect(ox + 4, oy + 4, 6, 6);
    ctx.fillRect(ox - 2, oy + 6, 6, 4);
  };
  drawOre(w * 0.15, h * 0.2, '#60a5fa'); // diamond
  drawOre(w * 0.85, h * 0.3, '#f5c542'); // gold
  drawOre(w * 0.7, h * 0.15, '#c0c0c0'); // iron
  drawOre(w * 0.3, h * 0.35, '#e94560'); // redstone

  // Torches
  const drawTorch = (tx, ty) => {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(tx, ty, 4, 16);
    ctx.fillStyle = '#f5c542';
    ctx.fillRect(tx - 2, ty - 6, 8, 8);
    const tglow = ctx.createRadialGradient(tx + 2, ty - 2, 2, tx + 2, ty - 2, 40);
    tglow.addColorStop(0, 'rgba(245, 197, 66, 0.25)');
    tglow.addColorStop(1, 'transparent');
    ctx.fillStyle = tglow;
    ctx.fillRect(tx - 40, ty - 40, 80, 80);
  };
  drawTorch(w * 0.25, h * 0.35);
  drawTorch(w * 0.75, h * 0.35);
  drawTorch(w * 0.5, h * 0.25);
}

export default function MainMenu() {
  const { setScreen, t, totalCoins } = useGame();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawMineBackground(canvas);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <div className="w-full h-full relative">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-6">
        {/* Title */}
        <div className="text-center mb-4">
          <h1 className="font-pixel text-cave-accent text-2xl md:text-4xl tracking-wider drop-shadow-lg">
            CaveSurvival
          </h1>
          <p className="font-pixel text-cave-gold text-[8px] md:text-xs mt-2 opacity-70">
            by Ryan & Mohammed
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={() => setScreen('modeselect')}
            className="font-pixel text-white text-sm md:text-base px-8 py-4 bg-cave-accent/80 hover:bg-cave-accent border-2 border-cave-accent rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-cave-accent/30"
          >
            {t('play')}
          </button>
          <button
            onClick={() => setScreen('skins')}
            className="font-pixel text-white text-sm md:text-base px-6 py-4 bg-purple-600/50 hover:bg-purple-600/70 border-2 border-purple-400 rounded-lg transition-all hover:scale-105 active:scale-95"
          >
            🎨 Skins
          </button>
          <button
            onClick={() => setScreen('options')}
            className="font-pixel text-white text-sm md:text-base px-6 py-4 bg-cave-mid/80 hover:bg-cave-light border-2 border-cave-light rounded-lg transition-all hover:scale-105 active:scale-95"
          >
            {t('options')}
          </button>
        </div>

        {/* Total coins display */}
        <div className="font-pixel text-[8px] text-cave-gold/60 mt-3">
          🪙 Gesamt: {totalCoins}
        </div>
      </div>
    </div>
  );
}
