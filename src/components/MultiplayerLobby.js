import { useState, useEffect, useCallback } from 'react';
import { useGame } from '../contexts/GameContext';

export default function MultiplayerLobby({ onBack, onStartGame }) {
  const { t, setMultiplayerRoom, setMultiplayerPlayers } = useGame();
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [roomCode, setRoomCode] = useState('');
  const [status, setStatus] = useState('');
  const [players, setPlayers] = useState([]);
  const [manager, setManager] = useState(null);
  const [connected, setConnected] = useState(false);
  const [supaUrl, setSupaUrl] = useState('');
  const [supaKey, setSupaKey] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const initManager = useCallback(async (action) => {
    try {
      const { default: MultiplayerManager } = await import('../game/systems/MultiplayerManager');
      const mgr = new MultiplayerManager();

      // Try environment vars first, then manual config
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || supaUrl;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supaKey;

      if (!url || !key) {
        setShowConfig(true);
        setStatus('Supabase-Konfiguration benötigt');
        return;
      }

      const ok = await mgr.init(url, key);
      if (!ok) { setStatus('Verbindung fehlgeschlagen'); return; }

      mgr.onPlayerJoin = (id, data) => {
        setPlayers((prev) => [...prev, { id, ...data }]);
      };
      mgr.onPlayerLeave = (id) => {
        setPlayers((prev) => prev.filter((p) => p.playerId !== id));
      };

      setManager(mgr);

      if (action === 'create') {
        await mgr.createRoom();
        setRoomCode(mgr.roomCode);
        setStatus('Raum erstellt! Teile den Code.');
        setConnected(true);
        setMultiplayerRoom(mgr.roomCode);
      } else if (action === 'join' && roomCode) {
        await mgr.joinRoom(roomCode);
        setStatus('Beigetreten!');
        setConnected(true);
        setMultiplayerRoom(mgr.roomCode);
      }
    } catch (e) {
      setStatus('Fehler: ' + e.message);
    }
  }, [roomCode, supaUrl, supaKey, setMultiplayerRoom]);

  useEffect(() => {
    return () => {
      if (manager) manager.destroy();
    };
  }, [manager]);

  const handleStartGame = () => {
    setMultiplayerPlayers(players);
    onStartGame(manager);
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-cave-dark">
      <div className="bg-cave-mid/90 border-2 border-cave-light rounded-xl p-6 w-[90%] max-w-md">
        <h2 className="font-pixel text-white text-sm text-center mb-5">
          🌐 Multiplayer
        </h2>

        {!mode && !showConfig && (
          <div className="space-y-3">
            <button
              onClick={() => { setMode('create'); initManager('create'); }}
              className="w-full font-pixel text-[10px] text-white py-3 bg-cave-green/20 border-2 border-cave-green rounded-lg hover:bg-cave-green/30 transition-all"
            >
              🏠 Raum erstellen
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full font-pixel text-[10px] text-white py-3 bg-cave-blue/20 border-2 border-cave-blue rounded-lg hover:bg-cave-blue/30 transition-all"
            >
              🔗 Raum beitreten
            </button>
            <button
              onClick={onBack}
              className="w-full font-pixel text-[10px] text-white/50 py-2 hover:text-white/80 transition-colors"
            >
              {t('back')}
            </button>
          </div>
        )}

        {showConfig && (
          <div className="space-y-3">
            <p className="font-pixel text-[8px] text-white/60 text-center">
              Trage deine Supabase-Daten ein (oder setze NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)
            </p>
            <input
              type="text"
              placeholder="Supabase URL"
              value={supaUrl}
              onChange={(e) => setSupaUrl(e.target.value)}
              className="w-full font-pixel text-[9px] bg-cave-dark border-2 border-cave-light rounded px-3 py-2 text-white placeholder-white/30 outline-none focus:border-cave-accent"
            />
            <input
              type="text"
              placeholder="Supabase Anon Key"
              value={supaKey}
              onChange={(e) => setSupaKey(e.target.value)}
              className="w-full font-pixel text-[9px] bg-cave-dark border-2 border-cave-light rounded px-3 py-2 text-white placeholder-white/30 outline-none focus:border-cave-accent"
            />
            <button
              onClick={() => { setShowConfig(false); initManager(mode || 'create'); }}
              className="w-full font-pixel text-[10px] text-white py-2 bg-cave-accent/70 border-2 border-cave-accent rounded-lg"
            >
              Verbinden
            </button>
            <button onClick={onBack} className="w-full font-pixel text-[9px] text-white/40 py-1">
              {t('back')}
            </button>
          </div>
        )}

        {mode === 'join' && !connected && !showConfig && (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Raum-Code eingeben"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full font-pixel text-sm bg-cave-dark border-2 border-cave-light rounded px-3 py-3 text-white text-center tracking-[0.3em] placeholder-white/30 outline-none focus:border-cave-accent uppercase"
            />
            <button
              onClick={() => initManager('join')}
              disabled={roomCode.length < 4}
              className="w-full font-pixel text-[10px] text-white py-3 bg-cave-accent/70 border-2 border-cave-accent rounded-lg disabled:opacity-30"
            >
              Beitreten
            </button>
            <button onClick={() => setMode(null)} className="w-full font-pixel text-[9px] text-white/40 py-1">
              {t('back')}
            </button>
          </div>
        )}

        {connected && (
          <div className="space-y-4">
            {/* Room code display */}
            <div className="text-center bg-cave-dark/60 rounded-lg py-3">
              <p className="font-pixel text-[8px] text-white/40 mb-1">Raum-Code</p>
              <p className="font-pixel text-lg text-cave-gold tracking-[0.3em]">{roomCode}</p>
              <p className="font-pixel text-[7px] text-white/30 mt-1">Teile diesen Code mit Freunden</p>
            </div>

            {/* Status */}
            <p className="font-pixel text-[8px] text-cave-green text-center">{status}</p>

            {/* Players */}
            <div className="bg-cave-dark/40 rounded-lg p-3">
              <p className="font-pixel text-[8px] text-white/50 mb-2">
                Spieler ({players.length + 1})
              </p>
              <div className="space-y-1">
                <div className="font-pixel text-[8px] text-cave-green flex items-center gap-2">
                  <span className="w-2 h-2 bg-cave-green rounded-full" />
                  Du {manager?.isHost ? '(Host)' : ''}
                </div>
                {players.map((p) => (
                  <div key={p.playerId || p.id} className="font-pixel text-[8px] text-white/70 flex items-center gap-2">
                    <span className="w-2 h-2 bg-cave-blue rounded-full" />
                    {(p.playerId || p.id || '').slice(0, 8)}
                  </div>
                ))}
              </div>
            </div>

            {/* Start / Leave */}
            <button
              onClick={handleStartGame}
              className="w-full font-pixel text-[10px] text-white py-3 bg-cave-accent/80 border-2 border-cave-accent rounded-lg hover:bg-cave-accent transition-all"
            >
              ▶ Spiel starten
            </button>
            <button
              onClick={() => { if (manager) manager.leave(); setConnected(false); setMode(null); onBack(); }}
              className="w-full font-pixel text-[9px] text-white/40 py-1 hover:text-white/60"
            >
              Raum verlassen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
