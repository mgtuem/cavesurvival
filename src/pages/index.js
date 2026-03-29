import Head from 'next/head';
import { useGame } from '../contexts/GameContext';
import SplashScreen from '../components/SplashScreen';
import MainMenu from '../components/MainMenu';
import OptionsMenu from '../components/OptionsMenu';
import DifficultySelect from '../components/DifficultySelect';
import ModeSelect from '../components/ModeSelect';
import SkinShop from '../components/SkinShop';
import GameWrapper from '../components/GameWrapper';
import VictoryScreen from '../components/VictoryScreen';
import MultiplayerLobby from '../components/MultiplayerLobby';

export default function Home() {
  const { screen, setScreen, brightness } = useGame();

  return (
    <>
      <Head>
        <title>CaveSurvival</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      </Head>
      <div className="w-full h-full relative overflow-hidden"
        style={{ filter: `brightness(${brightness / 100})` }}>
        {screen === 'splash' && <SplashScreen />}
        {screen === 'menu' && <MainMenu />}
        {screen === 'options' && <OptionsMenu />}
        {screen === 'modeselect' && <ModeSelect />}
        {screen === 'difficulty' && <DifficultySelect />}
        {screen === 'skins' && <SkinShop />}
        {screen === 'multiplayer' && (
          <MultiplayerLobby
            onBack={() => setScreen('menu')}
            onStartGame={() => setScreen('difficulty')}
          />
        )}
        {screen === 'game' && <GameWrapper />}
        {screen === 'victory' && <VictoryScreen />}
      </div>
    </>
  );
}
