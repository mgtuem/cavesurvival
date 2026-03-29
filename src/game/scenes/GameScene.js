import Phaser from 'phaser';
import soundManager from '../systems/SoundManager';

const WEAPON_DATA = {
  fist:           { damage: 12, name: 'Fäuste',          range: 35,  type: 'melee' },
  iron_sword:     { damage: 22, name: 'Eisenschwert',    range: 50,  type: 'melee' },
  iron_axe:       { damage: 28, name: 'Eisenaxt',        range: 50,  type: 'melee' },
  diamond_sword:  { damage: 35, name: 'Diamantschwert',  range: 55,  type: 'melee' },
  pistol:         { damage: 30, name: 'Pistole',         range: 280, type: 'ranged', ammo: 20 },
  shotgun:        { damage: 40, name: 'Shotgun',         range: 150, type: 'ranged', ammo: 8 },
  crossbow:       { damage: 25, name: 'Armbrust',        range: 300, type: 'ranged', ammo: 15 },
};

const DIFFICULTY_CONFIG = {
  easy:      { maxHp: 100, bonusDmg: 0, healAmt: 25, armorAmt: 25, startWeapon: 'iron_sword', creeperBlockDmg: 3,  waveCoins: 15, killCoins: 3 },
  medium:    { maxHp: 100, bonusDmg: 2, healAmt: 20, armorAmt: 15, startWeapon: 'fist',       creeperBlockDmg: 6,  waveCoins: 10, killCoins: 3 },
  nightmare: { maxHp: 80,  bonusDmg: 4, healAmt: 12, armorAmt: 10, startWeapon: 'fist',       creeperBlockDmg: 10, waveCoins: 8,  killCoins: 2 },
};

const MOB_BASE = {
  zombie:   { hp: 100, damage: 8,  atkDuration: 1400, speed: 48, color: 0x2d5a27, width: 28, height: 40 },
  skeleton: { hp: 80,  damage: 6,  atkDuration: 1200, speed: 42, color: 0xd4d4d4, width: 24, height: 40 },
  creeper:  { hp: 60,  damage: 12, atkDuration: 1800, speed: 32, color: 0x3daa3d, width: 26, height: 36 },
};

const WAVE_CONFIG = [
  { zombie: 4, skeleton: 4, creeper: 2 },
  { zombie: 5, skeleton: 5, creeper: 3 },
  { zombie: 6, skeleton: 6, creeper: 4 },
  { zombie: 7, skeleton: 7, creeper: 5 },
  { zombie: 8, skeleton: 8, creeper: 6 },
];

const EASTER_EGGS = [
  'Ryan ist stolz auf dich! 🎉',
  'Mohammed sagt: Weiter so! 💪',
  'Ghazals grüßt aus der Code-Cave! ⛏️',
  'Ryan flüstert: Du bist ein Legend! 🏆',
  'Mohammed & Ryan: Unaufhaltbar! 🔥',
];

export default class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) {
    this.gameCtx = data.gameCtx;
    this.multiplayerMgr = data.multiplayerMgr || null;
    const diff = data.difficulty || 'easy';
    this.diffConfig = DIFFICULTY_CONFIG[diff];
    this.playerMaxHp = this.diffConfig.maxHp;
    this.playerHp = this.diffConfig.maxHp;
    this.playerArmor = 0;
    this.playerCoins = 0;
    this.playerWeapon = this.diffConfig.startWeapon;
    this.playerAmmo = WEAPON_DATA[this.diffConfig.startWeapon]?.ammo || 0;
    this.blockCharges = 5;
    this.currentWave = 0;
    this.gameOver = false;
    this.parryCooldownTimer = 0;
    this.stunTimer = 0;
    this.joystickDir = { x: 0, y: 0 };
    this.isCrouching = false;
    this.attackCooldown = 0;
    this.mobsRemaining = 0;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.parryActive = false;
    this.blockActive = false;
    this.waveActive = false;
    this.betweenWaves = false;
    this.isJumping = false;
    this.jumpVelocity = 0;
    this.playerBaseY = 0;
    this.playerVisualY = 0;
    this.otherPlayers = {};
  }

  create() {
    const { width, height } = this.scale;
    this.mapFloorY = height * 0.72;
    this.playerBaseY = this.mapFloorY - 20;
    this.playerVisualY = this.playerBaseY;

    soundManager.init();
    soundManager.resume();
    if (this.gameCtx.musicOn) soundManager.startMusic();
    soundManager.setVolume(this.gameCtx.volume);

    this.drawMap(width, height);

    // Player hitbox (invisible)
    this.player = this.add.rectangle(width / 2, this.playerBaseY, 24, 40, 0xc4a44a);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setGravityY(0);
    this.player.setAlpha(0);

    // Steve visual
    this.playerHead = this.add.rectangle(0, -14, 20, 16, 0xc4a44a);
    this.playerHelmet = this.add.rectangle(0, -18, 22, 8, 0x60a5fa);
    this.playerEyeL = this.add.rectangle(-4, -14, 3, 3, 0x000000);
    this.playerEyeR = this.add.rectangle(4, -14, 3, 3, 0x000000);
    this.playerBody = this.add.rectangle(0, 2, 20, 20, 0x60a5fa);
    this.playerLegL = this.add.rectangle(-5, 16, 8, 12, 0x3b3b8a);
    this.playerLegR = this.add.rectangle(5, 16, 8, 12, 0x3b3b8a);
    this.playerArmL = this.add.rectangle(-14, 2, 8, 18, 0xc4a44a);
    this.playerArmR = this.add.rectangle(14, 2, 8, 18, 0xc4a44a);
    this.playerContainer = this.add.container(width / 2, this.playerBaseY, [
      this.playerBody, this.playerLegL, this.playerLegR,
      this.playerArmL, this.playerArmR,
      this.playerHead, this.playerHelmet, this.playerEyeL, this.playerEyeR,
    ]);

    this.mobs = this.add.group();
    this.projectiles = this.add.group();
    this.lootItems = this.add.group();

    this.time.delayedCall(1000, () => this.startWave());
    this.syncHud();
  }

  drawMap(w, h) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0d1a, 0x0d0d1a, 0x1a1a2e, 0x1a1a2e, 1);
    bg.fillRect(0, 0, w, h);
    bg.fillStyle(0x3d3d5c); bg.fillRect(0, this.mapFloorY, w, h - this.mapFloorY);
    bg.fillStyle(0x4a4a6a);
    for (let x = 0; x < w; x += 32) bg.fillRect(x, this.mapFloorY, 30, 3);
    bg.lineStyle(2, 0x6b7280);
    bg.strokeLineShape(new Phaser.Geom.Line(0, h * 0.84, w, h * 0.84));
    bg.strokeLineShape(new Phaser.Geom.Line(0, h * 0.88, w, h * 0.88));
    for (let x = 0; x < w; x += 40) { bg.lineStyle(3, 0x4b3621); bg.strokeLineShape(new Phaser.Geom.Line(x, h * 0.82, x, h * 0.90)); }
    bg.fillStyle(0x000000); bg.fillEllipse(40, h * 0.58, 80, 140);
    bg.lineStyle(2, 0x3d3d5c); bg.strokeEllipse(40, h * 0.58, 80, 140);
    bg.fillStyle(0x000000); bg.fillEllipse(w - 40, h * 0.58, 80, 140);
    bg.lineStyle(2, 0x3d3d5c); bg.strokeEllipse(w - 40, h * 0.58, 80, 140);
    [[w*0.25,h*0.35],[w*0.5,h*0.2],[w*0.75,h*0.35]].forEach(([tx,ty])=>{
      bg.fillStyle(0x8B4513); bg.fillRect(tx-2,ty,4,14);
      bg.fillStyle(0xf5c542); bg.fillRect(tx-3,ty-5,6,6);
    });
    [[w*0.15,h*0.2,0x60a5fa],[w*0.85,h*0.25,0xf5c542],[w*0.7,h*0.15,0xc0c0c0]].forEach(([ox,oy,c])=>{
      bg.fillStyle(c); bg.fillRect(ox,oy,5,5); bg.fillRect(ox+3,oy+3,5,5);
    });
  }

  // ═══ WAVES ═══
  startWave() {
    if (this.currentWave >= 5) { soundManager.playVictory(); this.gameCtx.setScreen('victory'); return; }
    const wConf = WAVE_CONFIG[this.currentWave];
    this.spawnQueue = [];
    for (const [type, count] of Object.entries(wConf)) for (let i = 0; i < count; i++) this.spawnQueue.push(type);
    Phaser.Utils.Array.Shuffle(this.spawnQueue);
    this.mobsRemaining = this.spawnQueue.length;
    this.waveActive = true; this.betweenWaves = false; this.spawnTimer = 0;
    this.blockCharges = 5; this.gameCtx.setBlockCharges(5);
    this.gameCtx.setWave(this.currentWave + 1);
    this.gameCtx.setWaveText(`Wave ${this.currentWave + 1}`);
    this.time.delayedCall(2000, () => this.gameCtx.setWaveText(''));
  }

  onWaveComplete() {
    this.waveActive = false;
    soundManager.playWaveComplete();
    const bonus = this.diffConfig.waveCoins + (this.currentWave * 5);
    this.playerCoins += bonus;
    this.showFloatingText(this.player.x, this.playerVisualY - 50, `+${bonus} 🪙`, 0xf5c542);
    const egg = EASTER_EGGS[this.currentWave] || EASTER_EGGS[0];
    this.gameCtx.setEasterEgg(egg);
    soundManager.playEasterEgg();
    this.currentWave++;
    this.syncHud();
    this.time.delayedCall(2500, () => {
      this.gameCtx.setEasterEgg('');
      if (this.currentWave < 5) { this.betweenWaves = true; this.gameCtx.setShowShop(true); this.scene.pause(); }
      else this.startWave();
    });
  }

  resumeAfterShop() { this.betweenWaves = false; this.scene.resume(); this.syncHud(); this.time.delayedCall(500, () => this.startWave()); }

  // ═══ SPAWNING ═══
  spawnMob(type) {
    const { width } = this.scale; const base = MOB_BASE[type];
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const x = side === 'left' ? 40 : width - 40;
    const y = this.mapFloorY - base.height / 2;
    const mob = this.add.rectangle(x, y, base.width, base.height, base.color);
    this.physics.add.existing(mob); mob.body.setCollideWorldBounds(true);
    mob.mobType = type; mob.mobHp = base.hp; mob.mobMaxHp = base.hp;
    mob.mobDamage = base.damage + this.diffConfig.bonusDmg;
    mob.mobSpeed = base.speed; mob.mobAtkDuration = base.atkDuration;
    mob.mobAtkTimer = 0; mob.isAttacking = false; mob.isStunned = false; mob.stunTimer = 0;
    mob.facingRight = side === 'left';
    mob.hpBarBg = this.add.rectangle(x, y - base.height/2 - 8, base.width + 4, 5, 0x333333);
    mob.hpBar = this.add.rectangle(x, y - base.height/2 - 8, base.width + 2, 3, 0xe94560);
    const eo = type === 'creeper' ? 5 : 3;
    mob.eyeL = this.add.rectangle(x - eo, y - base.height/4, 3, 3, 0x000000);
    mob.eyeR = this.add.rectangle(x + eo, y - base.height/4, 3, 3, 0x000000);
    if (type === 'creeper') mob.mouth = this.add.rectangle(x, y - base.height/4 + 6, 6, 4, 0x000000);
    if (type === 'skeleton') mob.bowLine = this.add.rectangle(x + (mob.facingRight?16:-16), y, 3, 20, 0x8B4513);
    this.mobs.add(mob);
  }

  // ═══ INPUT ═══
  setJoystick(x, y) { this.joystickDir = { x, y }; this.isCrouching = y > 0.6; }

  doJump() {
    if (this.isJumping || this.gameOver) return;
    this.isJumping = true; this.jumpVelocity = -7; soundManager.playJump();
  }

  doAttack() {
    if (this.attackCooldown > 0 || this.gameOver) return;
    this.attackCooldown = 350;
    const wep = WEAPON_DATA[this.playerWeapon] || WEAPON_DATA.fist;

    if (wep.type === 'ranged') {
      if (this.playerAmmo <= 0) { this.playerWeapon = 'fist'; this.playerAmmo = 0; this.syncHud(); return; }
      this.playerAmmo--; this.gameCtx.setAmmo(this.playerAmmo);
      const facing = this.playerContainer.scaleX >= 0 ? 1 : -1;
      soundManager.playGunshot();

      if (this.playerWeapon === 'shotgun') {
        for (let i = -1; i <= 1; i++) {
          const b = this.add.circle(this.player.x + facing*20, this.playerVisualY - 5, 3, 0xf5c542);
          this.physics.add.existing(b); b.body.setVelocityX(facing*350); b.body.setVelocityY(i*40);
          b.damage = Math.round(wep.damage/3); b.isPlayerBullet = true;
          this.projectiles.add(b);
          this.time.delayedCall(1500, () => { if(b.active) b.destroy(); });
        }
      } else {
        const b = this.add.circle(this.player.x + facing*20, this.playerVisualY - 5, 4, 0xf5c542);
        this.physics.add.existing(b);
        b.body.setVelocityX(facing * (this.playerWeapon === 'crossbow' ? 450 : 400));
        b.damage = wep.damage; b.isPlayerBullet = true;
        this.projectiles.add(b);
        this.time.delayedCall(2000, () => { if(b.active) b.destroy(); });
      }
      if (this.playerAmmo <= 0) { this.playerWeapon = 'fist'; this.playerAmmo = 0; this.syncHud(); }
    } else {
      if (this.playerWeapon === 'fist') soundManager.playPunch();
      else if (this.playerWeapon === 'iron_axe') soundManager.playAxeSwing();
      else soundManager.playSwordSwing();
      const facing = this.playerContainer.scaleX >= 0 ? 1 : -1;
      this.mobs.getChildren().forEach((mob) => {
        if (!mob.active) return;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.playerVisualY, mob.x, mob.y);
        const dir = mob.x - this.player.x;
        if (dist < wep.range + 20 && dir * facing >= 0) this.damageMob(mob, wep.damage);
      });
      this.tweens.add({ targets: this.playerArmR, angle: { from: 0, to: -90 }, duration: 120, yoyo: true });
    }
  }

  doBlock() {
    if (this.gameOver) return;
    if (this.parryCooldownTimer <= 0) {
      this.parryActive = true; this.parryCooldownTimer = 20000; this.gameCtx.setParryCooldown(20);
      let success = false;
      this.mobs.getChildren().forEach((mob) => { if (mob.active && mob.isAttacking) success = true; });
      if (success) {
        soundManager.playParry(); this.stunTimer = 3000;
        this.mobs.getChildren().forEach((mob) => { if(mob.active){mob.isStunned=true;mob.stunTimer=3000;mob.setAlpha(0.5);} });
        this.showFloatingText(this.player.x, this.playerVisualY - 40, 'PARRY!', 0xf5c542);
      }
      this.time.delayedCall(300, () => { this.parryActive = false; });
      return;
    }
    if (this.blockCharges > 0 && WEAPON_DATA[this.playerWeapon]?.type !== 'ranged') {
      this.blockActive = true; soundManager.playBlock();
      this.time.delayedCall(500, () => { this.blockActive = false; });
    }
  }

  // ═══ DAMAGE ═══
  damageMob(mob, damage) {
    mob.mobHp -= damage; soundManager.playHit();
    this.showFloatingText(mob.x, mob.y - 30, `-${damage}`, 0xff4444);
    mob.setFillStyle(0xffffff);
    this.time.delayedCall(80, () => { if(mob.active) mob.setFillStyle(MOB_BASE[mob.mobType].color); });
    if (mob.mobHp <= 0) this.onMobKill(mob);
    else mob.hpBar.setSize((MOB_BASE[mob.mobType].width + 2) * (mob.mobHp / mob.mobMaxHp), 3);
  }

  damagePlayer(amount, fromCreeper = false) {
    if (this.gameOver) return;
    if (this.blockActive && !fromCreeper && WEAPON_DATA[this.playerWeapon]?.type !== 'ranged') {
      this.blockCharges--; this.gameCtx.setBlockCharges(this.blockCharges);
      soundManager.playBlock(); this.showFloatingText(this.player.x, this.playerVisualY-40,'BLOCK',0x60a5fa);
      if (this.blockCharges <= 0) this.blockActive = false; return;
    }
    if (this.blockActive && fromCreeper) { amount = this.diffConfig.creeperBlockDmg; soundManager.playBlock(); }
    if (this.isJumping) { amount = Math.max(1, Math.floor(amount/2)); this.showFloatingText(this.player.x,this.playerVisualY-40,'AIR!',0xf5c542); }
    if (this.playerArmor > 0) { const ab = Math.min(this.playerArmor, amount); this.playerArmor -= ab; amount -= ab; }
    this.playerHp = Math.max(0, this.playerHp - amount);
    soundManager.playPlayerHurt(); this.syncHud(); this.cameras.main.flash(200,200,0,0,true);
    if (this.playerHp <= 0) this.onPlayerDeath();
  }

  // ═══ KILLS & LOOT ═══
  onMobKill(mob) {
    const cr = this.diffConfig.killCoins;
    this.playerCoins += cr; this.mobsRemaining--;
    soundManager.playMobDeath(); soundManager.playCoinPickup();
    this.showFloatingText(mob.x, mob.y - 10, `+${cr} 🪙`, 0xf5c542);
    ['hpBar','hpBarBg','eyeL','eyeR','mouth','bowLine'].forEach(k=>{if(mob[k])mob[k].destroy();});
    for(let i=0;i<6;i++){
      const p=this.add.circle(mob.x+Phaser.Math.Between(-15,15),mob.y+Phaser.Math.Between(-15,15),Phaser.Math.Between(2,5),0x888888);
      this.tweens.add({targets:p,alpha:0,y:p.y-20,duration:400,onComplete:()=>p.destroy()});
    }
    mob.destroy(); this.spawnLoot(mob.x, mob.y); this.syncHud();
    if (this.mobsRemaining <= 0 && this.spawnQueue.length === 0) {
      this.gameCtx.setWaveText(this.gameCtx.t('waveComplete'));
      this.time.delayedCall(1500, () => { this.gameCtx.setWaveText(''); this.onWaveComplete(); });
    }
  }

  spawnLoot(x, y) {
    const roll = Math.random();
    if (roll < 0.35) {
      const drops = ['iron_axe','iron_sword','diamond_sword','pistol','crossbow','shotgun'];
      const weights = [0.25, 0.20, 0.18, 0.15, 0.12, 0.10];
      let r = Math.random(), acc = 0, type = drops[0];
      for (let i = 0; i < drops.length; i++) { acc += weights[i]; if (r < acc) { type = drops[i]; break; } }
      const colors = { iron_axe:0xc0c0c0, iron_sword:0xcccccc, diamond_sword:0x60a5fa, pistol:0x555555, shotgun:0x8B4513, crossbow:0x654321 };
      const loot = this.add.rectangle(x, y-10, 14, 14, colors[type]||0xffffff);
      loot.setStrokeStyle(2, 0xffffff); this.physics.add.existing(loot, true);
      loot.lootType='weapon'; loot.weaponType=type; this.lootItems.add(loot);
      this.tweens.add({targets:loot,y:y-20,duration:600,yoyo:true,repeat:-1});
    } else {
      const c = Math.random();
      if (c < 0.55) {
        const l = this.add.rectangle(x,y-10,12,12,0x4ade80); l.setStrokeStyle(1,0xffffff);
        this.physics.add.existing(l,true); l.lootType='heal'; this.lootItems.add(l);
        this.tweens.add({targets:l,y:y-20,duration:600,yoyo:true,repeat:-1});
      } else if (c < 0.80) {
        const l = this.add.rectangle(x,y-10,12,12,0x60a5fa); l.setStrokeStyle(1,0xffffff);
        this.physics.add.existing(l,true); l.lootType='armor'; this.lootItems.add(l);
        this.tweens.add({targets:l,y:y-20,duration:600,yoyo:true,repeat:-1});
      }
    }
  }

  pickupLoot(loot) {
    soundManager.playPickup();
    if (loot.lootType === 'weapon') {
      this.playerWeapon = loot.weaponType;
      const w = WEAPON_DATA[loot.weaponType];
      this.playerAmmo = w?.ammo || 0;
      this.showFloatingText(this.player.x, this.playerVisualY-40, w?.name||loot.weaponType, 0xf5c542);
    } else if (loot.lootType === 'heal') {
      const h = this.diffConfig.healAmt;
      this.playerHp = Math.min(this.playerMaxHp, this.playerHp + h);
      this.showFloatingText(this.player.x, this.playerVisualY-40, `+${h} HP`, 0x4ade80);
    } else if (loot.lootType === 'armor') {
      const a = this.diffConfig.armorAmt;
      this.playerArmor = Math.min(50, this.playerArmor + a);
      this.showFloatingText(this.player.x, this.playerVisualY-40, `+${a} 🛡️`, 0x60a5fa);
    }
    loot.destroy(); this.syncHud();
  }

  // ═══ SHOP ═══
  shopBuy(item) {
    soundManager.playShopBuy();
    switch(item) {
      case 'heal': this.playerHp = this.playerMaxHp; break;
      case 'armor': this.playerArmor = 50; break;
      case 'diamond_sword': this.playerWeapon = 'diamond_sword'; this.playerAmmo = 0; break;
      case 'pistol': this.playerWeapon = 'pistol'; this.playerAmmo = 20; break;
      case 'shotgun': this.playerWeapon = 'shotgun'; this.playerAmmo = 8; break;
      case 'crossbow': this.playerWeapon = 'crossbow'; this.playerAmmo = 15; break;
      case 'extra_blocks': this.blockCharges = Math.min(10, this.blockCharges + 5); this.gameCtx.setBlockCharges(this.blockCharges); break;
    }
    this.syncHud();
  }

  // ═══ DEATH ═══
  onPlayerDeath() { this.gameOver = true; soundManager.playDeath(); this.gameCtx.setIsDead(true); this.scene.pause(); }

  revivePlayer() {
    this.playerHp = this.playerMaxHp; this.playerArmor = 50;
    this.playerWeapon = 'diamond_sword'; this.playerAmmo = 0;
    this.playerCoins -= 50; this.gameOver = false;
    this.gameCtx.setIsDead(false); this.syncHud(); this.scene.resume();
    this.playerContainer.setAlpha(0.5);
    this.time.delayedCall(1500, () => { if(this.playerContainer) this.playerContainer.setAlpha(1); });
  }

  // ═══ MULTIPLAYER ═══
  updateMultiplayer() {
    if (!this.multiplayerMgr) return;
    this.multiplayerMgr.sendState({ x:this.player.x, y:this.playerVisualY, scaleX:this.playerContainer.scaleX, hp:this.playerHp, weapon:this.playerWeapon });
  }
  drawOtherPlayer(id, st) {
    if (!this.otherPlayers[id]) {
      const p = this.add.rectangle(st.x,st.y,24,40,0xe07040); p.setStrokeStyle(2,0xffffff);
      const lb = this.add.text(st.x,st.y-30,id.slice(0,6),{fontSize:'8px',fontFamily:'"Press Start 2P"',color:'#fff'}).setOrigin(0.5);
      this.otherPlayers[id] = {body:p,label:lb};
    }
    const op = this.otherPlayers[id]; op.body.setPosition(st.x,st.y); op.label.setPosition(st.x,st.y-30);
  }
  removeOtherPlayer(id) {
    if(this.otherPlayers[id]){this.otherPlayers[id].body.destroy();this.otherPlayers[id].label.destroy();delete this.otherPlayers[id];}
  }

  // ═══ HUD ═══
  syncHud() {
    if(!this.gameCtx) return;
    this.gameCtx.setHp(this.playerHp); this.gameCtx.setMaxHp(this.playerMaxHp);
    this.gameCtx.setArmor(this.playerArmor); this.gameCtx.setCoins(this.playerCoins);
    this.gameCtx.setWeapon(this.playerWeapon); this.gameCtx.setAmmo(this.playerAmmo);
  }

  showFloatingText(x, y, text, color) {
    const t = this.add.text(x, y, text, {
      fontSize:'11px', fontFamily:'"Press Start 2P",monospace',
      color:`#${color.toString(16).padStart(6,'0')}`, stroke:'#000', strokeThickness:3,
    }).setOrigin(0.5);
    this.tweens.add({targets:t,y:y-35,alpha:0,duration:900,onComplete:()=>t.destroy()});
  }

  // ═══ UPDATE ═══
  update(time, delta) {
    if (this.gameOver) return;
    const dt = delta; const { width } = this.scale;

    // Player movement
    const speed = this.isCrouching ? 60 : 150;
    this.player.body.setVelocityX(this.joystickDir.x * speed);
    this.player.body.setVelocityY(0);
    this.player.y = this.playerBaseY;

    // Jump
    if (this.isJumping) {
      this.jumpVelocity += 0.35;
      this.playerVisualY += this.jumpVelocity;
      if (this.playerVisualY >= this.playerBaseY) { this.playerVisualY = this.playerBaseY; this.isJumping = false; this.jumpVelocity = 0; }
    } else { this.playerVisualY = this.playerBaseY; }

    this.playerContainer.setPosition(this.player.x, this.playerVisualY);
    const vx = this.joystickDir.x * speed;
    if (vx > 5) this.playerContainer.setScale(1, this.isCrouching?0.7:1);
    else if (vx < -5) this.playerContainer.setScale(-1, this.isCrouching?0.7:1);
    else { const sx = this.playerContainer.scaleX > 0 ? 1 : -1; this.playerContainer.setScale(sx, this.isCrouching?0.7:1); }

    // Animations
    if (this.isJumping) { this.playerArmL.y=-6;this.playerArmR.y=-6;this.playerLegL.y=10;this.playerLegR.y=10; }
    else if (Math.abs(vx)>5) {
      const bob=Math.sin(time/100)*3;
      this.playerLegL.y=16+bob; this.playerLegR.y=16-bob;
      this.playerArmL.y=2+bob*0.5; this.playerArmR.y=2-bob*0.5;
    } else { this.playerLegL.y=16;this.playerLegR.y=16;this.playerArmL.y=2;this.playerArmR.y=2; }

    // Cooldowns
    if(this.attackCooldown>0) this.attackCooldown-=dt;
    if(this.parryCooldownTimer>0) {
      this.parryCooldownTimer-=dt;
      this.gameCtx.setParryCooldown(Math.ceil(Math.max(0,this.parryCooldownTimer/1000)));
      if(this.parryCooldownTimer<=0) this.parryCooldownTimer=0;
    }

    // Spawning
    if(this.waveActive && this.spawnQueue.length>0) {
      this.spawnTimer-=dt;
      if(this.spawnTimer<=0) { this.spawnMob(this.spawnQueue.shift()); this.spawnTimer=700+Math.random()*500; }
    }

    // Mobs
    this.mobs.getChildren().forEach((mob) => {
      if(!mob.active) return;
      if(mob.isStunned) {
        mob.stunTimer-=dt; mob.body.setVelocityX(0);
        if(mob.stunTimer<=0){mob.isStunned=false;mob.setAlpha(1);}
        this.updateMobVisuals(mob); return;
      }
      const dist=Phaser.Math.Distance.Between(this.player.x,this.playerVisualY,mob.x,mob.y);
      const dir=this.player.x-mob.x; mob.facingRight=dir>0;
      const atkRange=mob.mobType==='skeleton'?180:mob.mobType==='creeper'?55:40;
      if(dist>atkRange) { mob.body.setVelocityX(dir>0?mob.mobSpeed:-mob.mobSpeed); mob.isAttacking=false; }
      else {
        mob.body.setVelocityX(0); mob.mobAtkTimer-=dt;
        if(mob.mobAtkTimer<=0) {
          mob.isAttacking=true; mob.mobAtkTimer=mob.mobAtkDuration;
          if(mob.mobType==='skeleton') {
            soundManager.playArrow();
            const ar=this.add.rectangle(mob.x,mob.y-5,10,3,0x8B4513);
            this.physics.add.existing(ar); const aD=this.player.x>mob.x?1:-1;
            ar.body.setVelocityX(aD*180); ar.body.setVelocityY(-8);
            ar.isArrow=true; ar.damage=mob.mobDamage; this.projectiles.add(ar);
            this.time.delayedCall(3000,()=>{if(ar.active)ar.destroy();});
          } else if(mob.mobType==='creeper') {
            soundManager.playExplosion(); this.cameras.main.shake(300,0.01);
            const bl=this.add.circle(mob.x,mob.y,50,0xf5c542,0.4);
            this.tweens.add({targets:bl,alpha:0,scale:2,duration:400,onComplete:()=>bl.destroy()});
            if(dist<70) this.damagePlayer(mob.mobDamage,true);
            mob.mobHp=0; this.onMobKill(mob); return;
          } else { if(dist<50) this.damagePlayer(mob.mobDamage,false); }
          this.time.delayedCall(300,()=>{if(mob.active)mob.isAttacking=false;});
        }
      }
      this.updateMobVisuals(mob);
    });

    // Projectiles
    this.projectiles.getChildren().forEach((proj) => {
      if(!proj.active) return;
      if(proj.isPlayerBullet) {
        this.mobs.getChildren().forEach((mob) => {
          if(!mob.active) return;
          if(Phaser.Math.Distance.Between(proj.x,proj.y,mob.x,mob.y)<25){this.damageMob(mob,proj.damage);proj.destroy();}
        });
      } else if(proj.isArrow) {
        const pd=Phaser.Math.Distance.Between(proj.x,proj.y,this.player.x,this.playerVisualY);
        if(pd<20) {
          if(this.isCrouching){this.showFloatingText(this.player.x,this.playerVisualY-40,'DODGE!',0xf5c542);}
          else if(this.blockActive&&WEAPON_DATA[this.playerWeapon]?.type!=='ranged'&&this.blockCharges>0){
            this.blockCharges--;this.gameCtx.setBlockCharges(this.blockCharges);soundManager.playBlock();
            this.showFloatingText(this.player.x,this.playerVisualY-40,'BLOCK',0x60a5fa);
          } else { this.damagePlayer(proj.damage,false); }
          proj.destroy();
        }
      }
      if(proj.x<-20||proj.x>width+20) proj.destroy();
    });

    // Loot
    this.lootItems.getChildren().forEach((loot) => {
      if(!loot.active) return;
      if(Phaser.Math.Distance.Between(this.player.x,this.playerVisualY,loot.x,loot.y)<30) this.pickupLoot(loot);
    });

    // Multiplayer
    if(this.multiplayerMgr&&time%5<1) this.updateMultiplayer();
  }

  updateMobVisuals(mob) {
    if(!mob.active) return;
    if(mob.hpBar)mob.hpBar.setPosition(mob.x,mob.y-mob.height/2-8);
    if(mob.hpBarBg)mob.hpBarBg.setPosition(mob.x,mob.y-mob.height/2-8);
    const eo=mob.mobType==='creeper'?5:3;
    if(mob.eyeL)mob.eyeL.setPosition(mob.x-eo,mob.y-mob.height/4);
    if(mob.eyeR)mob.eyeR.setPosition(mob.x+eo,mob.y-mob.height/4);
    if(mob.mouth)mob.mouth.setPosition(mob.x,mob.y-mob.height/4+6);
    if(mob.bowLine)mob.bowLine.setPosition(mob.x+(mob.facingRight?16:-16),mob.y);
  }
}
