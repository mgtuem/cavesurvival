import Phaser from 'phaser';
import soundManager from '../systems/SoundManager';
import { SKINS } from '../../contexts/GameContext';

// ─── Weapons ───
const WEAPON_DATA = {
  fist:          { damage:12, name:'Fäuste',        range:35,  type:'melee' },
  iron_sword:    { damage:22, name:'Eisenschwert',   range:50,  type:'melee' },
  iron_axe:      { damage:28, name:'Eisenaxt',       range:50,  type:'melee' },
  diamond_sword: { damage:35, name:'Diamantschwert', range:55,  type:'melee' },
  pistol:        { damage:30, name:'Pistole',        range:280, type:'ranged', ammo:20 },
  shotgun:       { damage:40, name:'Shotgun',        range:150, type:'ranged', ammo:8 },
  crossbow:      { damage:25, name:'Armbrust',       range:300, type:'ranged', ammo:15 },
};

const DIFFICULTY_CONFIG = {
  easy:      { maxHp:100, bonusDmg:0, healAmt:25, armorAmt:25, startWeapon:'iron_sword', creeperBlockDmg:3,  waveCoins:15, killCoins:3 },
  medium:    { maxHp:100, bonusDmg:2, healAmt:20, armorAmt:15, startWeapon:'fist',       creeperBlockDmg:6,  waveCoins:10, killCoins:3 },
  nightmare: { maxHp:80,  bonusDmg:4, healAmt:12, armorAmt:10, startWeapon:'fist',       creeperBlockDmg:10, waveCoins:8,  killCoins:2 },
};

const MOB_BASE = {
  zombie:   { hp:100, damage:8,  atkDuration:1400, speed:48, color:0x2d5a27, width:28, height:40 },
  skeleton: { hp:80,  damage:6,  atkDuration:1200, speed:42, color:0xd4d4d4, width:24, height:40 },
  creeper:  { hp:60,  damage:12, atkDuration:1800, speed:32, color:0x3daa3d, width:26, height:36 },
};

const WAVE_CONFIG = [
  { zombie:4, skeleton:4, creeper:2 },
  { zombie:5, skeleton:5, creeper:3 },
  { zombie:6, skeleton:6, creeper:4 },
  { zombie:7, skeleton:7, creeper:5 },
  { zombie:8, skeleton:8, creeper:6 },
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
    this.isPvP = data.gameMode === 'pvp';
    const diff = data.difficulty || 'easy';
    this.diffConfig = DIFFICULTY_CONFIG[diff];

    // Get skin colors
    const skinData = SKINS.find(s => s.id === data.selectedSkin) || SKINS[0];
    this.skinColors = skinData;

    this.playerMaxHp = this.diffConfig.maxHp;
    this.playerHp = this.diffConfig.maxHp;
    this.playerArmor = 0;
    this.playerCoins = 0;
    this.playerWeapon = this.diffConfig.startWeapon;
    this.playerAmmo = WEAPON_DATA[this.diffConfig.startWeapon]?.ammo || 0;

    // Inventory: array of {type, ammo}
    this.playerInventory = [];
    if (this.diffConfig.startWeapon !== 'fist') {
      this.playerInventory.push({ type: this.diffConfig.startWeapon, ammo: this.playerAmmo });
    }
    this.inventoryIndex = this.playerInventory.length > 0 ? 0 : -1;

    this.blockCharges = 5;
    this.currentWave = 0;
    this.gameOver = false;
    this.parryCooldownTimer = 0;
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
    this.mpSyncTimer = 0;
  }

  create() {
    const { width, height } = this.scale;
    this.mapFloorY = height * 0.72;
    this.playerBaseY = this.mapFloorY - 20;
    this.playerVisualY = this.playerBaseY;

    soundManager.init(); soundManager.resume();
    if (this.gameCtx.musicOn) soundManager.startMusic();
    soundManager.setVolume(this.gameCtx.volume);

    this.drawMap(width, height);

    // ─── Player hitbox (invisible) ───
    this.player = this.add.rectangle(width / 2, this.playerBaseY, 24, 40, 0x000000, 0);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    // ─── Player visual with skin colors ───
    const sc = this.skinColors;
    this.playerHead = this.add.rectangle(0, -14, 20, 16, sc.head);
    this.playerHelmet = this.add.rectangle(0, -18, 22, 8, sc.helmet);
    this.playerEyeL = this.add.rectangle(-4, -14, 3, 3, 0x000000);
    this.playerEyeR = this.add.rectangle(4, -14, 3, 3, 0x000000);
    this.playerBody = this.add.rectangle(0, 2, 20, 20, sc.body);
    this.playerLegL = this.add.rectangle(-5, 16, 8, 12, sc.legs);
    this.playerLegR = this.add.rectangle(5, 16, 8, 12, sc.legs);
    this.playerArmL = this.add.rectangle(-14, 2, 8, 18, sc.head);
    this.playerArmR = this.add.rectangle(14, 2, 8, 18, sc.head);

    // ─── Player HP bar (above character) ───
    this.playerHpBarBg = this.add.rectangle(0, -32, 36, 5, 0x333333);
    this.playerHpBar = this.add.rectangle(0, -32, 34, 3, 0x4ade80);
    // Armor bar below HP
    this.playerArmorBar = this.add.rectangle(0, -26, 34, 2, 0x60a5fa);
    this.playerArmorBar.setAlpha(0);

    // Weapon indicator above head
    this.weaponLabel = this.add.text(0, -40, '', {
      fontSize: '7px', fontFamily: '"Press Start 2P",monospace', color: '#f5c542',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    this.playerContainer = this.add.container(width / 2, this.playerBaseY, [
      this.playerBody, this.playerLegL, this.playerLegR,
      this.playerArmL, this.playerArmR,
      this.playerHead, this.playerHelmet, this.playerEyeL, this.playerEyeR,
      this.playerHpBarBg, this.playerHpBar, this.playerArmorBar,
      this.weaponLabel,
    ]);

    // Groups
    this.mobs = this.add.group();
    this.projectiles = this.add.group();
    this.lootItems = this.add.group();

    // Setup multiplayer listeners
    if (this.multiplayerMgr) {
      this.multiplayerMgr.onPlayerState = (id, state) => {
        this.drawOtherPlayer(id, state);
      };
      this.multiplayerMgr.onPlayerLeave = (id) => {
        this.removeOtherPlayer(id);
      };
      this.multiplayerMgr.onGameEvent = (payload) => {
        this.handleRemoteEvent(payload);
      };
    }

    // Start
    if (!this.isPvP) {
      this.time.delayedCall(1000, () => this.startWave());
    }
    this.syncHud();
    this.updateWeaponLabel();
  }

  drawMap(w, h) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0d1a, 0x0d0d1a, 0x1a1a2e, 0x1a1a2e, 1);
    bg.fillRect(0, 0, w, h);
    bg.fillStyle(0x3d3d5c); bg.fillRect(0, this.mapFloorY, w, h - this.mapFloorY);
    bg.fillStyle(0x4a4a6a);
    for (let x = 0; x < w; x += 32) bg.fillRect(x, this.mapFloorY, 30, 3);
    bg.lineStyle(2, 0x6b7280);
    bg.strokeLineShape(new Phaser.Geom.Line(0, h*0.84, w, h*0.84));
    bg.strokeLineShape(new Phaser.Geom.Line(0, h*0.88, w, h*0.88));
    for (let x = 0; x < w; x += 40) { bg.lineStyle(3,0x4b3621); bg.strokeLineShape(new Phaser.Geom.Line(x,h*0.82,x,h*0.90)); }
    bg.fillStyle(0x000000); bg.fillEllipse(40,h*0.58,80,140);
    bg.lineStyle(2,0x3d3d5c); bg.strokeEllipse(40,h*0.58,80,140);
    bg.fillStyle(0x000000); bg.fillEllipse(w-40,h*0.58,80,140);
    bg.lineStyle(2,0x3d3d5c); bg.strokeEllipse(w-40,h*0.58,80,140);
    [[w*0.25,h*0.35],[w*0.5,h*0.2],[w*0.75,h*0.35]].forEach(([tx,ty])=>{
      bg.fillStyle(0x8B4513); bg.fillRect(tx-2,ty,4,14);
      bg.fillStyle(0xf5c542); bg.fillRect(tx-3,ty-5,6,6);
    });
    [[w*0.15,h*0.2,0x60a5fa],[w*0.85,h*0.25,0xf5c542],[w*0.7,h*0.15,0xc0c0c0]].forEach(([ox,oy,c])=>{
      bg.fillStyle(c); bg.fillRect(ox,oy,5,5); bg.fillRect(ox+3,oy+3,5,5);
    });

    // PvP mode indicator
    if (this.isPvP) {
      this.add.text(w/2, 15, '⚔️ PvP MODE ⚔️', {
        fontSize:'10px', fontFamily:'"Press Start 2P",monospace', color:'#e94560',
        stroke:'#000', strokeThickness:3
      }).setOrigin(0.5);
    }
  }

  // ═══ PLAYER HP BAR UPDATE ═══
  updatePlayerBars() {
    const hpPct = Math.max(0, this.playerHp / this.playerMaxHp);
    this.playerHpBar.setSize(34 * hpPct, 3);
    // Color: green > yellow > red
    let color = 0x4ade80;
    if (hpPct < 0.5) color = 0xf5c542;
    if (hpPct < 0.25) color = 0xe94560;
    this.playerHpBar.setFillStyle(color);

    if (this.playerArmor > 0) {
      this.playerArmorBar.setAlpha(1);
      this.playerArmorBar.setSize(34 * (this.playerArmor / 50), 2);
    } else {
      this.playerArmorBar.setAlpha(0);
    }
  }

  updateWeaponLabel() {
    const icons = { fist:'👊', iron_sword:'⚔️', iron_axe:'🪓', diamond_sword:'💎', pistol:'🔫', shotgun:'💥', crossbow:'🏹' };
    this.weaponLabel.setText(icons[this.playerWeapon] || '👊');
  }

  // ═══ INVENTORY SYSTEM ═══
  switchWeapon() {
    if (this.playerInventory.length === 0) {
      this.playerWeapon = 'fist';
      this.playerAmmo = 0;
      this.inventoryIndex = -1;
      this.syncHud();
      this.updateWeaponLabel();
      return;
    }

    // Save current ammo to inventory
    if (this.inventoryIndex >= 0 && this.inventoryIndex < this.playerInventory.length) {
      this.playerInventory[this.inventoryIndex].ammo = this.playerAmmo;
    }

    // Cycle: fist -> inv[0] -> inv[1] -> ... -> fist
    if (this.inventoryIndex < 0) {
      // Currently fist, go to first inventory item
      this.inventoryIndex = 0;
    } else {
      this.inventoryIndex++;
      if (this.inventoryIndex >= this.playerInventory.length) {
        this.inventoryIndex = -1; // back to fist
      }
    }

    if (this.inventoryIndex < 0) {
      this.playerWeapon = 'fist';
      this.playerAmmo = 0;
    } else {
      const item = this.playerInventory[this.inventoryIndex];
      this.playerWeapon = item.type;
      this.playerAmmo = item.ammo || 0;
    }

    soundManager.playPickup();
    this.showFloatingText(this.player.x, this.playerVisualY - 50,
      WEAPON_DATA[this.playerWeapon]?.name || 'Fäuste', 0xf5c542);
    this.syncHud();
    this.updateWeaponLabel();
  }

  addToInventory(weaponType) {
    // Check if already in inventory -> refresh ammo
    const existing = this.playerInventory.find(i => i.type === weaponType);
    const wep = WEAPON_DATA[weaponType];
    if (existing) {
      existing.ammo = wep?.ammo || 0;
    } else {
      this.playerInventory.push({ type: weaponType, ammo: wep?.ammo || 0 });
    }
    // Auto-equip if it's the first weapon
    if (this.playerInventory.length === 1 && this.playerWeapon === 'fist') {
      this.inventoryIndex = 0;
      this.playerWeapon = weaponType;
      this.playerAmmo = wep?.ammo || 0;
    }
    this.gameCtx.setInventory([...this.playerInventory]);
    this.syncHud();
    this.updateWeaponLabel();
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
    this.waveActive = false; soundManager.playWaveComplete();
    const bonus = this.diffConfig.waveCoins + (this.currentWave * 5);
    this.playerCoins += bonus;
    this.showFloatingText(this.player.x, this.playerVisualY - 50, `+${bonus} 🪙`, 0xf5c542);
    const egg = EASTER_EGGS[this.currentWave] || EASTER_EGGS[0];
    this.gameCtx.setEasterEgg(egg); soundManager.playEasterEgg();
    this.currentWave++; this.syncHud();
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
      if (this.playerAmmo <= 0) { this.switchToFistOrNext(); return; }
      this.playerAmmo--; this.gameCtx.setAmmo(this.playerAmmo);
      // Update inventory ammo
      if (this.inventoryIndex >= 0 && this.playerInventory[this.inventoryIndex]) {
        this.playerInventory[this.inventoryIndex].ammo = this.playerAmmo;
      }
      const facing = this.playerContainer.scaleX >= 0 ? 1 : -1;
      soundManager.playGunshot();

      if (this.playerWeapon === 'shotgun') {
        for (let i = -1; i <= 1; i++) {
          const b = this.add.circle(this.player.x+facing*20, this.playerVisualY-5, 3, 0xf5c542);
          this.physics.add.existing(b); b.body.setVelocityX(facing*350); b.body.setVelocityY(i*40);
          b.damage = Math.round(wep.damage/3); b.isPlayerBullet = true; b.shooterId = 'local';
          this.projectiles.add(b);
          this.time.delayedCall(1500, () => { if(b.active) b.destroy(); });
        }
      } else {
        const b = this.add.circle(this.player.x+facing*20, this.playerVisualY-5, 4, 0xf5c542);
        this.physics.add.existing(b);
        b.body.setVelocityX(facing*(this.playerWeapon==='crossbow'?450:400));
        b.damage = wep.damage; b.isPlayerBullet = true; b.shooterId = 'local';
        this.projectiles.add(b);
        this.time.delayedCall(2000, () => { if(b.active) b.destroy(); });
      }

      // Send multiplayer event
      if (this.multiplayerMgr) {
        this.multiplayerMgr.sendEvent('shoot', {
          x: this.player.x, y: this.playerVisualY, facing, weapon: this.playerWeapon, damage: wep.damage
        });
      }

      if (this.playerAmmo <= 0) this.switchToFistOrNext();
    } else {
      if (this.playerWeapon === 'fist') soundManager.playPunch();
      else if (this.playerWeapon === 'iron_axe') soundManager.playAxeSwing();
      else soundManager.playSwordSwing();
      const facing = this.playerContainer.scaleX >= 0 ? 1 : -1;

      // Hit mobs (survival)
      this.mobs.getChildren().forEach((mob) => {
        if (!mob.active) return;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.playerVisualY, mob.x, mob.y);
        const dir = mob.x - this.player.x;
        if (dist < wep.range + 20 && dir * facing >= 0) this.damageMob(mob, wep.damage);
      });

      // PvP: send melee attack for other players to check
      if (this.isPvP && this.multiplayerMgr) {
        this.multiplayerMgr.sendEvent('melee', {
          x: this.player.x, y: this.playerVisualY, facing, range: wep.range, damage: wep.damage
        });
      }

      this.tweens.add({ targets: this.playerArmR, angle:{from:0,to:-90}, duration:120, yoyo:true });
    }
  }

  switchToFistOrNext() {
    // Remove empty ranged weapon from inventory
    if (this.inventoryIndex >= 0) {
      this.playerInventory.splice(this.inventoryIndex, 1);
      this.gameCtx.setInventory([...this.playerInventory]);
    }
    this.inventoryIndex = this.playerInventory.length > 0 ? 0 : -1;
    if (this.inventoryIndex >= 0) {
      const item = this.playerInventory[0];
      this.playerWeapon = item.type;
      this.playerAmmo = item.ammo || 0;
    } else {
      this.playerWeapon = 'fist'; this.playerAmmo = 0;
    }
    this.syncHud(); this.updateWeaponLabel();
  }

  doBlock() {
    if (this.gameOver) return;
    if (this.parryCooldownTimer <= 0) {
      this.parryActive = true; this.parryCooldownTimer = 20000; this.gameCtx.setParryCooldown(20);
      let success = false;
      this.mobs.getChildren().forEach((mob) => { if(mob.active&&mob.isAttacking) success=true; });
      if (success) {
        soundManager.playParry();
        this.mobs.getChildren().forEach((mob) => { if(mob.active){mob.isStunned=true;mob.stunTimer=3000;mob.setAlpha(0.5);} });
        this.showFloatingText(this.player.x, this.playerVisualY-40, 'PARRY!', 0xf5c542);
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
    this.showFloatingText(mob.x, mob.y-30, `-${damage}`, 0xff4444);
    mob.setFillStyle(0xffffff);
    this.time.delayedCall(80, () => { if(mob.active) mob.setFillStyle(MOB_BASE[mob.mobType].color); });
    if (mob.mobHp <= 0) this.onMobKill(mob);
    else mob.hpBar.setSize((MOB_BASE[mob.mobType].width+2)*(mob.mobHp/mob.mobMaxHp), 3);
  }

  damagePlayer(amount, fromCreeper=false) {
    if (this.gameOver) return;
    if (this.blockActive && !fromCreeper && WEAPON_DATA[this.playerWeapon]?.type!=='ranged') {
      this.blockCharges--; this.gameCtx.setBlockCharges(this.blockCharges);
      soundManager.playBlock(); this.showFloatingText(this.player.x,this.playerVisualY-40,'BLOCK',0x60a5fa);
      if (this.blockCharges<=0) this.blockActive=false; return;
    }
    if (this.blockActive && fromCreeper) { amount=this.diffConfig.creeperBlockDmg; soundManager.playBlock(); }
    if (this.isJumping) { amount=Math.max(1,Math.floor(amount/2)); this.showFloatingText(this.player.x,this.playerVisualY-40,'AIR!',0xf5c542); }
    if (this.playerArmor>0) { const ab=Math.min(this.playerArmor,amount); this.playerArmor-=ab; amount-=ab; }
    this.playerHp = Math.max(0, this.playerHp-amount);
    soundManager.playPlayerHurt(); this.syncHud(); this.updatePlayerBars();
    this.cameras.main.flash(200,200,0,0,true);
    if (this.playerHp<=0) this.onPlayerDeath();
  }

  // ═══ KILLS & LOOT ═══
  onMobKill(mob) {
    const cr = this.diffConfig.killCoins;
    this.playerCoins += cr; this.mobsRemaining--;
    soundManager.playMobDeath(); soundManager.playCoinPickup();
    this.showFloatingText(mob.x, mob.y-10, `+${cr}🪙`, 0xf5c542);
    ['hpBar','hpBarBg','eyeL','eyeR','mouth','bowLine'].forEach(k=>{if(mob[k])mob[k].destroy();});
    for(let i=0;i<6;i++){
      const p=this.add.circle(mob.x+Phaser.Math.Between(-15,15),mob.y+Phaser.Math.Between(-15,15),Phaser.Math.Between(2,5),0x888888);
      this.tweens.add({targets:p,alpha:0,y:p.y-20,duration:400,onComplete:()=>p.destroy()});
    }
    mob.destroy(); this.spawnLoot(mob.x,mob.y); this.syncHud();
    if (this.mobsRemaining<=0 && this.spawnQueue.length===0) {
      this.gameCtx.setWaveText(this.gameCtx.t('waveComplete'));
      this.time.delayedCall(1500, () => { this.gameCtx.setWaveText(''); this.onWaveComplete(); });
    }
  }

  spawnLoot(x, y) {
    const roll = Math.random();
    if (roll < 0.35) {
      const drops=['iron_axe','iron_sword','diamond_sword','pistol','crossbow','shotgun'];
      const weights=[0.25,0.20,0.18,0.15,0.12,0.10];
      let r=Math.random(),acc=0,type=drops[0];
      for(let i=0;i<drops.length;i++){acc+=weights[i];if(r<acc){type=drops[i];break;}}
      const colors={iron_axe:0xc0c0c0,iron_sword:0xcccccc,diamond_sword:0x60a5fa,pistol:0x555555,shotgun:0x8B4513,crossbow:0x654321};
      const loot=this.add.rectangle(x,y-10,14,14,colors[type]||0xffffff);
      loot.setStrokeStyle(2,0xffffff); this.physics.add.existing(loot,true);
      loot.lootType='weapon'; loot.weaponType=type; this.lootItems.add(loot);
      this.tweens.add({targets:loot,y:y-20,duration:600,yoyo:true,repeat:-1});
    } else {
      const c=Math.random();
      if(c<0.55){
        const l=this.add.rectangle(x,y-10,12,12,0x4ade80);l.setStrokeStyle(1,0xffffff);
        this.physics.add.existing(l,true);l.lootType='heal';this.lootItems.add(l);
        this.tweens.add({targets:l,y:y-20,duration:600,yoyo:true,repeat:-1});
      }else if(c<0.80){
        const l=this.add.rectangle(x,y-10,12,12,0x60a5fa);l.setStrokeStyle(1,0xffffff);
        this.physics.add.existing(l,true);l.lootType='armor';this.lootItems.add(l);
        this.tweens.add({targets:l,y:y-20,duration:600,yoyo:true,repeat:-1});
      }
    }
  }

  pickupLoot(loot) {
    soundManager.playPickup();
    if (loot.lootType==='weapon') {
      this.addToInventory(loot.weaponType);
      const w=WEAPON_DATA[loot.weaponType];
      this.showFloatingText(this.player.x,this.playerVisualY-40,w?.name||loot.weaponType,0xf5c542);
    } else if (loot.lootType==='heal') {
      const h=this.diffConfig.healAmt;
      this.playerHp=Math.min(this.playerMaxHp,this.playerHp+h);
      this.showFloatingText(this.player.x,this.playerVisualY-40,`+${h} HP`,0x4ade80);
    } else if (loot.lootType==='armor') {
      const a=this.diffConfig.armorAmt;
      this.playerArmor=Math.min(50,this.playerArmor+a);
      this.showFloatingText(this.player.x,this.playerVisualY-40,`+${a} 🛡️`,0x60a5fa);
    }
    loot.destroy(); this.syncHud(); this.updatePlayerBars();
  }

  // ═══ SHOP ═══
  shopBuy(item) {
    soundManager.playShopBuy();
    switch(item) {
      case 'heal': this.playerHp=this.playerMaxHp; break;
      case 'armor': this.playerArmor=50; break;
      case 'diamond_sword': this.addToInventory('diamond_sword'); break;
      case 'pistol': this.addToInventory('pistol'); break;
      case 'shotgun': this.addToInventory('shotgun'); break;
      case 'crossbow': this.addToInventory('crossbow'); break;
      case 'extra_blocks': this.blockCharges=Math.min(10,this.blockCharges+5); this.gameCtx.setBlockCharges(this.blockCharges); break;
    }
    this.syncHud(); this.updatePlayerBars();
  }

  // ═══ DEATH ═══
  onPlayerDeath() { this.gameOver=true; soundManager.playDeath(); this.gameCtx.setIsDead(true); this.scene.pause(); }
  revivePlayer() {
    this.playerHp=this.playerMaxHp; this.playerArmor=50;
    this.addToInventory('diamond_sword');
    this.playerWeapon='diamond_sword'; this.playerAmmo=0;
    this.inventoryIndex = this.playerInventory.findIndex(i=>i.type==='diamond_sword');
    this.playerCoins-=50; this.gameOver=false;
    this.gameCtx.setIsDead(false); this.syncHud(); this.updatePlayerBars(); this.updateWeaponLabel();
    this.scene.resume();
    this.playerContainer.setAlpha(0.5);
    this.time.delayedCall(1500,()=>{if(this.playerContainer)this.playerContainer.setAlpha(1);});
  }

  // ═══ MULTIPLAYER ═══
  sendMultiplayerState() {
    if (!this.multiplayerMgr || !this.multiplayerMgr.connected) return;
    this.multiplayerMgr.sendState({
      x: this.player.x,
      y: this.playerVisualY,
      scaleX: this.playerContainer.scaleX,
      hp: this.playerHp,
      maxHp: this.playerMaxHp,
      armor: this.playerArmor,
      weapon: this.playerWeapon,
      skin: this.skinColors.id || 'steve',
      isCrouching: this.isCrouching,
      isJumping: this.isJumping,
    });
  }

  drawOtherPlayer(id, st) {
    if (!this.otherPlayers[id]) {
      // Create full visual for remote player
      const remoteSkin = SKINS.find(s => s.id === st.skin) || SKINS[0];
      const head = this.add.rectangle(0, -14, 20, 16, remoteSkin.head);
      const helmet = this.add.rectangle(0, -18, 22, 8, remoteSkin.helmet);
      const eyeL = this.add.rectangle(-4, -14, 3, 3, 0x000000);
      const eyeR = this.add.rectangle(4, -14, 3, 3, 0x000000);
      const body = this.add.rectangle(0, 2, 20, 20, remoteSkin.body);
      const legL = this.add.rectangle(-5, 16, 8, 12, remoteSkin.legs);
      const legR = this.add.rectangle(5, 16, 8, 12, remoteSkin.legs);
      const armL = this.add.rectangle(-14, 2, 8, 18, remoteSkin.head);
      const armR = this.add.rectangle(14, 2, 8, 18, remoteSkin.head);

      // HP bar
      const hpBg = this.add.rectangle(0, -32, 36, 5, 0x333333);
      const hpBar = this.add.rectangle(0, -32, 34, 3, 0x4ade80);

      // Name label
      const label = this.add.text(0, -42, id.slice(0, 6), {
        fontSize: '7px', fontFamily: '"Press Start 2P",monospace', color: '#88ccff',
        stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5);

      const container = this.add.container(st.x || 200, st.y || this.playerBaseY, [
        body, legL, legR, armL, armR, head, helmet, eyeL, eyeR, hpBg, hpBar, label,
      ]);

      this.otherPlayers[id] = { container, hpBar, label, legL, legR };
    }

    const op = this.otherPlayers[id];

    // Smooth interpolation
    const targetX = st.x || op.container.x;
    const targetY = st.y || op.container.y;
    op.container.x += (targetX - op.container.x) * 0.3;
    op.container.y += (targetY - op.container.y) * 0.3;
    op.container.setScale(st.scaleX || 1, st.isCrouching ? 0.7 : 1);

    // Update HP bar
    if (st.maxHp && st.hp !== undefined) {
      const pct = Math.max(0, st.hp / st.maxHp);
      op.hpBar.setSize(34 * pct, 3);
      let c = 0x4ade80; if (pct < 0.5) c = 0xf5c542; if (pct < 0.25) c = 0xe94560;
      op.hpBar.setFillStyle(c);
    }
  }

  removeOtherPlayer(id) {
    if (this.otherPlayers[id]) {
      this.otherPlayers[id].container.destroy();
      delete this.otherPlayers[id];
    }
  }

  handleRemoteEvent(payload) {
    // PvP: handle incoming attacks from other players
    if (this.isPvP) {
      if (payload.eventType === 'shoot') {
        const d = payload.data;
        const b = this.add.circle(d.x + d.facing*20, d.y-5, 4, 0xff6666);
        this.physics.add.existing(b);
        b.body.setVelocityX(d.facing * 400);
        b.damage = d.damage; b.isRemoteBullet = true;
        this.projectiles.add(b);
        this.time.delayedCall(2000, () => { if(b.active) b.destroy(); });
      } else if (payload.eventType === 'melee') {
        const d = payload.data;
        const dist = Phaser.Math.Distance.Between(d.x, d.y, this.player.x, this.playerVisualY);
        const dir = this.player.x - d.x;
        if (dist < d.range + 20 && dir * d.facing >= 0) {
          this.damagePlayer(d.damage, false);
        }
      }
    }
  }

  // ═══ HUD ═══
  syncHud() {
    if(!this.gameCtx) return;
    this.gameCtx.setHp(this.playerHp); this.gameCtx.setMaxHp(this.playerMaxHp);
    this.gameCtx.setArmor(this.playerArmor); this.gameCtx.setCoins(this.playerCoins);
    this.gameCtx.setWeapon(this.playerWeapon); this.gameCtx.setAmmo(this.playerAmmo);
    this.gameCtx.setInventory([...this.playerInventory]);
  }

  showFloatingText(x,y,text,color) {
    const t=this.add.text(x,y,text,{fontSize:'11px',fontFamily:'"Press Start 2P",monospace',
      color:`#${color.toString(16).padStart(6,'0')}`,stroke:'#000',strokeThickness:3}).setOrigin(0.5);
    this.tweens.add({targets:t,y:y-35,alpha:0,duration:900,onComplete:()=>t.destroy()});
  }

  // ═══ UPDATE ═══
  update(time, delta) {
    if (this.gameOver) return;
    const dt = delta; const { width } = this.scale;

    // Player movement
    const speed = this.isCrouching ? 60 : 150;
    const vx = this.joystickDir.x * speed;
    this.player.body.setVelocityX(vx); this.player.body.setVelocityY(0);
    this.player.y = this.playerBaseY;

    // Jump
    if (this.isJumping) {
      this.jumpVelocity += 0.35;
      this.playerVisualY += this.jumpVelocity;
      if (this.playerVisualY >= this.playerBaseY) { this.playerVisualY = this.playerBaseY; this.isJumping = false; this.jumpVelocity = 0; }
    } else { this.playerVisualY = this.playerBaseY; }

    this.playerContainer.setPosition(this.player.x, this.playerVisualY);
    if (vx > 5) this.playerContainer.setScale(1, this.isCrouching?0.7:1);
    else if (vx < -5) this.playerContainer.setScale(-1, this.isCrouching?0.7:1);
    else { const sx = this.playerContainer.scaleX > 0 ? 1 : -1; this.playerContainer.setScale(sx, this.isCrouching?0.7:1); }

    // Animations
    if (this.isJumping) { this.playerArmL.y=-6;this.playerArmR.y=-6;this.playerLegL.y=10;this.playerLegR.y=10; }
    else if (Math.abs(vx)>5) {
      const bob=Math.sin(time/100)*3;
      this.playerLegL.y=16+bob;this.playerLegR.y=16-bob;this.playerArmL.y=2+bob*0.5;this.playerArmR.y=2-bob*0.5;
    } else { this.playerLegL.y=16;this.playerLegR.y=16;this.playerArmL.y=2;this.playerArmR.y=2; }

    // Update player HP bar
    this.updatePlayerBars();

    // Cooldowns
    if(this.attackCooldown>0) this.attackCooldown-=dt;
    if(this.parryCooldownTimer>0){this.parryCooldownTimer-=dt;this.gameCtx.setParryCooldown(Math.ceil(Math.max(0,this.parryCooldownTimer/1000)));if(this.parryCooldownTimer<=0)this.parryCooldownTimer=0;}

    // Spawning (survival only)
    if(!this.isPvP && this.waveActive && this.spawnQueue.length>0){
      this.spawnTimer-=dt;
      if(this.spawnTimer<=0){this.spawnMob(this.spawnQueue.shift());this.spawnTimer=700+Math.random()*500;}
    }

    // Mobs AI (survival)
    if (!this.isPvP) {
      this.mobs.getChildren().forEach((mob)=>{
        if(!mob.active)return;
        if(mob.isStunned){mob.stunTimer-=dt;mob.body.setVelocityX(0);if(mob.stunTimer<=0){mob.isStunned=false;mob.setAlpha(1);}this.updateMobVisuals(mob);return;}
        const dist=Phaser.Math.Distance.Between(this.player.x,this.playerVisualY,mob.x,mob.y);
        const dir=this.player.x-mob.x;mob.facingRight=dir>0;
        const atkRange=mob.mobType==='skeleton'?180:mob.mobType==='creeper'?55:40;
        if(dist>atkRange){mob.body.setVelocityX(dir>0?mob.mobSpeed:-mob.mobSpeed);mob.isAttacking=false;}
        else{
          mob.body.setVelocityX(0);mob.mobAtkTimer-=dt;
          if(mob.mobAtkTimer<=0){
            mob.isAttacking=true;mob.mobAtkTimer=mob.mobAtkDuration;
            if(mob.mobType==='skeleton'){
              soundManager.playArrow();const ar=this.add.rectangle(mob.x,mob.y-5,10,3,0x8B4513);
              this.physics.add.existing(ar);const aD=this.player.x>mob.x?1:-1;
              ar.body.setVelocityX(aD*180);ar.body.setVelocityY(-8);ar.isArrow=true;ar.damage=mob.mobDamage;
              this.projectiles.add(ar);this.time.delayedCall(3000,()=>{if(ar.active)ar.destroy();});
            }else if(mob.mobType==='creeper'){
              soundManager.playExplosion();this.cameras.main.shake(300,0.01);
              const bl=this.add.circle(mob.x,mob.y,50,0xf5c542,0.4);
              this.tweens.add({targets:bl,alpha:0,scale:2,duration:400,onComplete:()=>bl.destroy()});
              if(dist<70)this.damagePlayer(mob.mobDamage,true);mob.mobHp=0;this.onMobKill(mob);return;
            }else{if(dist<50)this.damagePlayer(mob.mobDamage,false);}
            this.time.delayedCall(300,()=>{if(mob.active)mob.isAttacking=false;});
          }
        }
        this.updateMobVisuals(mob);
      });
    }

    // Projectiles
    this.projectiles.getChildren().forEach((proj)=>{
      if(!proj.active)return;
      if(proj.isPlayerBullet){
        this.mobs.getChildren().forEach((mob)=>{if(!mob.active)return;if(Phaser.Math.Distance.Between(proj.x,proj.y,mob.x,mob.y)<25){this.damageMob(mob,proj.damage);proj.destroy();}});
      }else if(proj.isArrow){
        const pd=Phaser.Math.Distance.Between(proj.x,proj.y,this.player.x,this.playerVisualY);
        if(pd<20){
          if(this.isCrouching){this.showFloatingText(this.player.x,this.playerVisualY-40,'DODGE!',0xf5c542);}
          else if(this.blockActive&&WEAPON_DATA[this.playerWeapon]?.type!=='ranged'&&this.blockCharges>0){
            this.blockCharges--;this.gameCtx.setBlockCharges(this.blockCharges);soundManager.playBlock();
            this.showFloatingText(this.player.x,this.playerVisualY-40,'BLOCK',0x60a5fa);
          }else{this.damagePlayer(proj.damage,false);}
          proj.destroy();
        }
      }else if(proj.isRemoteBullet){
        // PvP incoming bullet
        const pd=Phaser.Math.Distance.Between(proj.x,proj.y,this.player.x,this.playerVisualY);
        if(pd<20){this.damagePlayer(proj.damage,false);proj.destroy();}
      }
      if(proj.x<-20||proj.x>width+20)proj.destroy();
    });

    // Loot pickup
    this.lootItems.getChildren().forEach((loot)=>{
      if(!loot.active)return;
      if(Phaser.Math.Distance.Between(this.player.x,this.playerVisualY,loot.x,loot.y)<30)this.pickupLoot(loot);
    });

    // Multiplayer sync (every ~50ms)
    this.mpSyncTimer += dt;
    if (this.multiplayerMgr && this.mpSyncTimer > 50) {
      this.mpSyncTimer = 0;
      this.sendMultiplayerState();
    }
  }

  updateMobVisuals(mob) {
    if(!mob.active)return;
    if(mob.hpBar)mob.hpBar.setPosition(mob.x,mob.y-mob.height/2-8);
    if(mob.hpBarBg)mob.hpBarBg.setPosition(mob.x,mob.y-mob.height/2-8);
    const eo=mob.mobType==='creeper'?5:3;
    if(mob.eyeL)mob.eyeL.setPosition(mob.x-eo,mob.y-mob.height/4);
    if(mob.eyeR)mob.eyeR.setPosition(mob.x+eo,mob.y-mob.height/4);
    if(mob.mouth)mob.mouth.setPosition(mob.x,mob.y-mob.height/4+6);
    if(mob.bowLine)mob.bowLine.setPosition(mob.x+(mob.facingRight?16:-16),mob.y);
  }
}
