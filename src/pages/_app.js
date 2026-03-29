import '../styles/globals.css';
import { GameProvider } from '../contexts/GameContext';
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <GameProvider>
      <Component {...pageProps} />
    </GameProvider>
  );
}
