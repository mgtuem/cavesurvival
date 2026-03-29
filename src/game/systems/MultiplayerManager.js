// MultiplayerManager - Uses Supabase Realtime for online co-op
// Players share the same wave, see each other, and fight together.

class MultiplayerManager {
  constructor() {
    this.supabase = null;
    this.channel = null;
    this.roomCode = null;
    this.playerId = null;
    this.isHost = false;
    this.onPlayerJoin = null;
    this.onPlayerLeave = null;
    this.onPlayerState = null;
    this.onGameEvent = null;
    this.connected = false;
  }

  async init(supabaseUrl, supabaseKey) {
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Multiplayer: No Supabase config provided');
      return false;
    }
    try {
      const { createClient } = await import('@supabase/supabase-js');
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        realtime: { params: { eventsPerSecond: 20 } },
      });
      this.playerId = 'p_' + Math.random().toString(36).slice(2, 8);
      return true;
    } catch (e) {
      console.warn('Multiplayer init failed:', e);
      return false;
    }
  }

  generateRoomCode() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  async createRoom() {
    this.roomCode = this.generateRoomCode();
    this.isHost = true;
    return this.joinChannel();
  }

  async joinRoom(code) {
    this.roomCode = code.toUpperCase();
    this.isHost = false;
    return this.joinChannel();
  }

  async joinChannel() {
    if (!this.supabase || !this.roomCode) return false;
    try {
      this.channel = this.supabase.channel(`game:${this.roomCode}`, {
        config: { presence: { key: this.playerId } },
      });

      // Presence: track who's in the room
      this.channel.on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((p) => {
          if (p.playerId !== this.playerId && this.onPlayerJoin) {
            this.onPlayerJoin(p.playerId, p);
          }
        });
      });

      this.channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((p) => {
          if (this.onPlayerLeave) this.onPlayerLeave(p.playerId);
        });
      });

      // Broadcast: game state sync
      this.channel.on('broadcast', { event: 'player_state' }, ({ payload }) => {
        if (payload.playerId !== this.playerId && this.onPlayerState) {
          this.onPlayerState(payload.playerId, payload.state);
        }
      });

      this.channel.on('broadcast', { event: 'game_event' }, ({ payload }) => {
        if (payload.playerId !== this.playerId && this.onGameEvent) {
          this.onGameEvent(payload);
        }
      });

      await this.channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.channel.track({
            playerId: this.playerId,
            isHost: this.isHost,
            joinedAt: Date.now(),
          });
          this.connected = true;
        }
      });

      return true;
    } catch (e) {
      console.warn('Failed to join channel:', e);
      return false;
    }
  }

  sendState(state) {
    if (!this.channel || !this.connected) return;
    this.channel.send({
      type: 'broadcast',
      event: 'player_state',
      payload: { playerId: this.playerId, state },
    });
  }

  sendEvent(eventType, data) {
    if (!this.channel || !this.connected) return;
    this.channel.send({
      type: 'broadcast',
      event: 'game_event',
      payload: { playerId: this.playerId, eventType, data },
    });
  }

  getPlayers() {
    if (!this.channel) return [];
    const state = this.channel.presenceState();
    const players = [];
    for (const [, presences] of Object.entries(state)) {
      presences.forEach((p) => players.push(p));
    }
    return players;
  }

  async leave() {
    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
    }
    this.connected = false;
    this.roomCode = null;
  }

  destroy() {
    this.leave();
    this.supabase = null;
  }
}

export default MultiplayerManager;
