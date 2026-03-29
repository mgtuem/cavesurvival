import { useEffect, useState } from 'react';
import { useGame } from '../contexts/GameContext';

export default function SplashScreen() {
  const { setScreen } = useGame();
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const fadeIn = setTimeout(() => setOpacity(1), 100);
    const fadeOut = setTimeout(() => setOpacity(0), 2400);
    const navigate = setTimeout(() => setScreen('menu'), 3000);
    return () => {
      clearTimeout(fadeIn);
      clearTimeout(fadeOut);
      clearTimeout(navigate);
    };
  }, [setScreen]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-cave-dark">
      <div
        className="text-center transition-opacity duration-500"
        style={{ opacity }}
      >
        <p className="font-pixel text-cave-accent text-lg md:text-2xl tracking-wider">
          Made by Ghazals
        </p>
        <div className="mt-4 flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-cave-accent rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
