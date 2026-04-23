import { useEffect, useMemo, useRef, useState } from 'react';
import { haptic, stageComplete } from '../../utils/bridge';

type ScreenState = 'title' | 'select' | 'playing' | 'paused' | 'gameover';
type HeroKey = 'TITAN' | 'STRIKER' | 'SERAPH';

interface HudState {
  timeLeft: number;
  scores: { blue: number; red: number };
  hp: number;
  maxHp: number;
  respawnTimer: number;
  cds: { primary: number; secondary: number; utility: number; special: number };
  skillMax: { primary: number; secondary: number; utility: number; special: number };
  ultCharge: number;
  ultCost: number;
  active: boolean;
}

interface GameOverState {
  victory: boolean;
  blueScore: number;
  redScore: number;
}

interface HeroDef {
  name: HeroKey;
  role: 'Tank' | 'Damage' | 'Support';
  desc: string;
  color: string;
  shape: 'circle' | 'square' | 'triangle';
  radius: number;
  hp: number;
  speed: number;
  skills: {
    primary: SkillDef;
    secondary: SkillDef;
    utility: SkillDef;
    special: SkillDef;
    ultimate: UltimateSkillDef;
  };
}

interface SkillDef {
  name: string;
  cd: number;
  use: (engine: GameEngine, caster: Character, target: Vec2) => void;
}

interface UltimateSkillDef {
  name: string;
  cost: number;
  use: (engine: GameEngine, caster: Character, target: Vec2) => void;
}

type SkillKey = keyof HeroDef['skills'];

class Vec2 {
  constructor(public x = 0, public y = 0) {}

  add(v: Vec2) {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  sub(v: Vec2) {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  mult(n: number) {
    return new Vec2(this.x * n, this.y * n);
  }

  mag() {
    return Math.sqrt((this.x * this.x) + (this.y * this.y));
  }

  normalize() {
    const magnitude = this.mag();
    return magnitude === 0 ? new Vec2(0, 0) : new Vec2(this.x / magnitude, this.y / magnitude);
  }

  dist(v: Vec2) {
    return this.sub(v).mag();
  }

  clone() {
    return new Vec2(this.x, this.y);
  }
}

const CFG = {
  mapWidth: 2400,
  mapHeight: 1600,
  scoreLimit: 15,
  timeLimit: 180,
  blueColor: '#3b82f6',
  redColor: '#ef4444',
  spawnTime: 4,
};

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

class GameObject {
  pos: Vec2;
  vel = new Vec2();
  active = true;

  constructor(x: number, y: number, public radius: number) {
    this.pos = new Vec2(x, y);
  }

  update(dt: number) {
    this.pos = this.pos.add(this.vel.mult(dt));
  }
}

class Projectile extends GameObject {
  dmg: number;
  color: string;
  isAoe: boolean;
  smart: boolean;
  lifetime = 2;
  bounces = 0;

  constructor(
    x: number,
    y: number,
    dir: Vec2,
    speed: number,
    dmg: number,
    radius: number,
    color: string,
    isAoe: boolean,
    smart: boolean,
    public owner: Character,
  ) {
    super(x, y, radius);
    this.vel = dir.mult(speed);
    this.dmg = dmg;
    this.color = color;
    this.isAoe = isAoe;
    this.smart = smart;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.shadowBlur = 14;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Particle {
  pos: Vec2;
  vel: Vec2;
  life = rand(0.2, 0.6);
  maxLife = this.life;
  radius = rand(2, 5);

  constructor(x: number, y: number, public color: string) {
    this.pos = new Vec2(x, y);
    this.vel = new Vec2(rand(-1, 1), rand(-1, 1)).normalize().mult(rand(50, 200));
  }

  update(dt: number) {
    this.pos = this.pos.add(this.vel.mult(dt));
    this.vel = this.vel.mult(0.9);
    this.life -= dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class FloatingText {
  pos: Vec2;
  vel = new Vec2(rand(-20, 20), rand(-40, -80));
  life = 1;

  constructor(x: number, y: number, public text: string, public color: string) {
    this.pos = new Vec2(x, y);
  }

  update(dt: number) {
    this.pos = this.pos.add(this.vel.mult(dt));
    this.life -= dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.font = '700 20px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';
    ctx.strokeText(this.text, this.pos.x, this.pos.y);
    ctx.fillText(this.text, this.pos.x, this.pos.y);
    ctx.restore();
  }
}

interface Buff {
  type: string;
  timer: number;
  data: Record<string, number>;
}

class Character extends GameObject {
  heroDef: HeroDef;
  hp: number;
  maxHp: number;
  speed: number;
  angle = 0;
  targetAngle = 0;
  cds = { primary: 0, secondary: 0, utility: 0, special: 0 };
  ultCharge = 0;
  buffs: Buff[] = [];
  respawnTimer = 0;
  kills = 0;
  aiTimer = 0;
  navPoint: Vec2 | null = null;

  constructor(
    public engine: GameEngine,
    x: number,
    y: number,
    public team: 0 | 1,
    public heroKey: HeroKey,
    public isPlayer = false,
  ) {
    super(x, y, HERO_DEFS[heroKey].radius);
    this.heroDef = HERO_DEFS[heroKey];
    this.hp = this.heroDef.hp;
    this.maxHp = this.heroDef.hp;
    this.speed = this.heroDef.speed;
  }

  addBuff(type: string, duration: number, data: Record<string, number>) {
    const existing = this.buffs.find((buff) => buff.type === type);
    if (existing) {
      existing.timer = duration;
      existing.data = data;
      return;
    }
    this.buffs.push({ type, timer: duration, data });
  }

  takeDamage(amount: number, source: { owner: Character } | null) {
    if (!this.active || this.hp <= 0) return;

    const dr = this.buffs.find((buff) => buff.type === 'dr');
    if (dr) amount *= dr.data.val ?? 1;

    const shield = this.buffs.find((buff) => buff.type === 'shield');
    let damageColor = '#ef4444';
    if (shield) {
      if ((shield.data.amount ?? 0) >= amount) {
        shield.data.amount = (shield.data.amount ?? 0) - amount;
        amount = 0;
        damageColor = '#60a5fa';
      } else {
        amount -= shield.data.amount ?? 0;
        shield.data.amount = 0;
      }
    }

    if (amount > 0) {
      this.hp -= amount;
      if (source && source.owner.team !== this.team) {
        const maxUlt = this.heroDef.skills.ultimate.cost;
        source.owner.ultCharge = Math.min(maxUlt, source.owner.ultCharge + amount);
      }
    }

    this.engine.spawnText(this.pos.x, this.pos.y - 30, `${Math.round(amount || 0)}`, damageColor);
    if (this.isPlayer) this.engine.cameraShake(3);

    if (this.hp <= 0) this.die(source?.owner ?? null);
  }

  heal(amount: number) {
    if (!this.active || this.hp <= 0) return;
    const missing = this.maxHp - this.hp;
    const actual = Math.min(missing, amount);
    this.hp += actual;
    if (actual > 0) {
      this.engine.spawnText(this.pos.x, this.pos.y - 30, `+${Math.round(actual)}`, '#10b981');
    }
  }

  die(killer: Character | null) {
    this.hp = 0;
    this.active = false;
    this.respawnTimer = CFG.spawnTime;
    this.engine.spawnParticles(this.pos, this.team === 0 ? CFG.blueColor : CFG.redColor, 50);
    if (killer) {
      killer.kills += 1;
      killer.ultCharge = Math.min(killer.heroDef.skills.ultimate.cost, killer.ultCharge + 100);
      this.engine.addScore(killer.team, 1);
      this.engine.logKill(killer, this);
    }
  }

  updateStats(dt: number) {
    if (this.respawnTimer > 0) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this.respawn();
      return false;
    }

    (Object.keys(this.cds) as Array<keyof typeof this.cds>).forEach((key) => {
      if (this.cds[key] > 0) this.cds[key] -= dt;
    });

    this.ultCharge = Math.min(this.heroDef.skills.ultimate.cost, this.ultCharge + (5 * dt));

    for (let index = this.buffs.length - 1; index >= 0; index -= 1) {
      const buff = this.buffs[index];
      buff.timer -= dt;
      if (buff.type === 'shield' && (buff.data.amount ?? 0) <= 0) buff.timer = 0;
      if (buff.type === 'tranquil') {
        this.heal(80 * dt);
        this.engine.aoeHeal(this, this.pos, 250, 40 * dt, false);
        if (Math.random() < 0.1) this.engine.spawnParticles(this.pos, '#10b981', 1);
      }
      if (buff.timer <= 0) this.buffs.splice(index, 1);
    }

    let diff = this.targetAngle - this.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.angle += diff * 15 * dt;

    return true;
  }

  respawn() {
    this.active = true;
    this.hp = this.maxHp;
    this.buffs = [];
    (Object.keys(this.cds) as Array<keyof typeof this.cds>).forEach((key) => {
      this.cds[key] = 0;
    });

    const spawnZone = this.team === 0 ? this.engine.map.blueSpawn : this.engine.map.redSpawn;
    this.pos = new Vec2(rand(spawnZone.x, spawnZone.x + spawnZone.w), rand(spawnZone.y, spawnZone.y + spawnZone.h));
    this.vel = new Vec2();
  }

  useSkill(key: SkillKey, target: Vec2) {
    const skill = this.heroDef.skills[key];
    if (!skill) return;

    const cdMult = this.buffs.find((buff) => buff.type === 'overdrive') ? 0.5 : 1;

    if (key === 'ultimate') {
      if (this.ultCharge >= skill.cost) {
        this.ultCharge = 0;
        skill.use(this.engine, this, target);
        if (this.isPlayer) haptic('ultimate');
      }
      return;
    }

    if (this.cds[key] <= 0) {
      this.cds[key] = skill.cd * cdMult;
      skill.use(this.engine, this, target);
      if (this.isPlayer) haptic('ability');
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.active) return;

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);

    const shield = this.buffs.find((buff) => buff.type === 'shield');
    if (shield) {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(59, 130, 246, ${clamp((shield.data.amount ?? 0) / 200, 0.2, 0.8)})`;
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    if (this.buffs.find((buff) => buff.type === 'overdrive')) {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (this.buffs.find((buff) => buff.type === 'tranquil')) {
      ctx.beginPath();
      ctx.arc(0, 0, 250, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.fill();
    }

    ctx.fillStyle = this.team === 0 ? CFG.blueColor : CFG.redColor;
    if (this.isPlayer) {
      ctx.shadowBlur = 14;
      ctx.shadowColor = ctx.fillStyle;
    }

    ctx.beginPath();
    if (this.heroDef.shape === 'circle') {
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    } else if (this.heroDef.shape === 'square') {
      ctx.rect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
    } else {
      ctx.moveTo(this.radius, 0);
      ctx.lineTo(-this.radius, this.radius);
      ctx.lineTo(-this.radius, -this.radius);
      ctx.closePath();
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.radius - 4, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (this.hp < this.maxHp || this.isPlayer) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(this.pos.x - 24, this.pos.y - this.radius - 18, 48, 7);
      ctx.fillStyle = this.team === 0 ? '#10b981' : '#ef4444';
      ctx.fillRect(this.pos.x - 24, this.pos.y - this.radius - 18, 48 * (this.hp / this.maxHp), 7);
    }
  }
}

const HERO_DEFS: Record<HeroKey, HeroDef> = {
  TITAN: {
    name: 'TITAN',
    role: 'Tank',
    desc: 'Heavy frontliner with barrier and crowd control.',
    color: '#f59e0b',
    shape: 'square',
    radius: 28,
    hp: 600,
    speed: 220,
    skills: {
      primary: {
        name: 'Flak Gun',
        cd: 0.8,
        use: (engine, caster, target) => {
          engine.shootSpread(caster, target, 3, 15, 400, 15);
        },
      },
      secondary: {
        name: 'Aegis',
        cd: 8,
        use: (engine, caster) => {
          caster.addBuff('shield', 4, { amount: 300 });
          engine.spawnParticles(caster.pos, '#f59e0b', 20);
        },
      },
      utility: {
        name: 'Charge',
        cd: 6,
        use: (_engine, caster, target) => {
          const dir = target.sub(caster.pos).normalize();
          caster.vel = dir.mult(800);
          caster.addBuff('dr', 0.5, { val: 0.5 });
        },
      },
      special: {
        name: 'Slam',
        cd: 8,
        use: (engine, caster) => {
          engine.aoeAttack(caster, caster.pos, 150, 40, true);
          engine.cameraShake(10);
        },
      },
      ultimate: {
        name: 'Earthquake',
        cost: 1000,
        use: (engine, caster) => {
          engine.aoeAttack(caster, caster.pos, 300, 100, true, 2);
          engine.cameraShake(20);
        },
      },
    },
  },
  STRIKER: {
    name: 'STRIKER',
    role: 'Damage',
    desc: 'Agile damage dealer with explosives.',
    color: '#ef4444',
    shape: 'triangle',
    radius: 22,
    hp: 250,
    speed: 320,
    skills: {
      primary: {
        name: 'Pulse Rifle',
        cd: 0.15,
        use: (engine, caster, target) => {
          engine.shootProjectile(caster, target, 800, 15, 6, 1.5, '#fff');
        },
      },
      secondary: {
        name: 'Helix Rocket',
        cd: 6,
        use: (engine, caster, target) => {
          engine.shootProjectile(caster, target, 600, 50, 12, 2, '#ef4444', true);
        },
      },
      utility: {
        name: 'Dash',
        cd: 4,
        use: (_engine, caster, target) => {
          const dir = caster.vel.mag() > 0 ? caster.vel.normalize() : target.sub(caster.pos).normalize();
          caster.vel = dir.mult(1000);
        },
      },
      special: {
        name: 'Frag',
        cd: 8,
        use: (engine, caster, target) => {
          engine.shootGrenade(caster, target);
        },
      },
      ultimate: {
        name: 'Overdrive',
        cost: 800,
        use: (engine, caster) => {
          caster.addBuff('overdrive', 8, {});
          engine.spawnParticles(caster.pos, '#ef4444', 30);
        },
      },
    },
  },
  SERAPH: {
    name: 'SERAPH',
    role: 'Support',
    desc: 'Mobile healer and buffer.',
    color: '#10b981',
    shape: 'circle',
    radius: 20,
    hp: 200,
    speed: 280,
    skills: {
      primary: {
        name: 'Energy Bolt',
        cd: 0.4,
        use: (engine, caster, target) => {
          engine.shootProjectile(caster, target, 600, 20, 8, 1.5, '#10b981', false, true);
        },
      },
      secondary: {
        name: 'Heal Burst',
        cd: 5,
        use: (engine, caster) => {
          engine.aoeHeal(caster, caster.pos, 200, 50);
          engine.spawnParticles(caster.pos, '#10b981', 20);
        },
      },
      utility: {
        name: 'Glide',
        cd: 5,
        use: (_engine, caster) => {
          caster.addBuff('speed', 3, { mult: 1.5 });
        },
      },
      special: {
        name: 'Aura',
        cd: 10,
        use: (engine, caster) => {
          engine.aoeBuff(caster, caster.pos, 250, 'shield', 4, { amount: 100 });
        },
      },
      ultimate: {
        name: 'Tranquility',
        cost: 900,
        use: (_engine, caster) => {
          caster.addBuff('tranquil', 5, {});
        },
      },
    },
  },
};

interface InputState {
  keys: Record<string, boolean>;
  mousePos: Vec2;
  m1: boolean;
  m2: boolean;
}

interface EngineCallbacks {
  onHudUpdate: (state: HudState) => void;
  onGameOver: (state: GameOverState) => void;
  onPauseChange: (paused: boolean) => void;
  onKillFeed: (entry: { id: number; text: string; killerTeam: 0 | 1; victimTeam: 0 | 1 }) => void;
}

class GameEngine {
  ctx: CanvasRenderingContext2D;
  state: ScreenState = 'title';
  lastTime = 0;
  camera = new Vec2();
  shake = 0;
  animationId: number | null = null;
  entities: Character[] = [];
  projectiles: Projectile[] = [];
  particles: Particle[] = [];
  texts: FloatingText[] = [];
  walls: Array<{ x: number; y: number; w: number; h: number }> = [];
  player: Character | null = null;
  scores = { 0: 0, 1: 0 };
  timeLeft = CFG.timeLimit;
  selectedHero: HeroKey | null = null;
  killId = 0;

  map = {
    w: CFG.mapWidth,
    h: CFG.mapHeight,
    blueSpawn: { x: 50, y: (CFG.mapHeight / 2) - 200, w: 200, h: 400 },
    redSpawn: { x: CFG.mapWidth - 250, y: (CFG.mapHeight / 2) - 200, w: 200, h: 400 },
  };

  constructor(
    private canvas: HTMLCanvasElement,
    private input: InputState,
    private callbacks: EngineCallbacks,
  ) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('2D canvas context is required');
    this.ctx = context;
    this.setupMap();
    this.resize();
    this.loop = this.loop.bind(this);
    this.animationId = window.requestAnimationFrame(this.loop);
  }

  destroy() {
    if (this.animationId !== null) {
      window.cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = width * ratio;
    this.canvas.height = height * ratio;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  setupMap() {
    this.walls = [
      { x: 0, y: 0, w: CFG.mapWidth, h: 20 },
      { x: 0, y: CFG.mapHeight - 20, w: CFG.mapWidth, h: 20 },
      { x: 0, y: 0, w: 20, h: CFG.mapHeight },
      { x: CFG.mapWidth - 20, y: 0, w: 20, h: CFG.mapHeight },
      { x: (CFG.mapWidth / 2) - 50, y: (CFG.mapHeight / 2) - 250, w: 100, h: 500 },
      { x: CFG.mapWidth / 4, y: 200, w: 300, h: 100 },
      { x: CFG.mapWidth / 4, y: CFG.mapHeight - 300, w: 300, h: 100 },
      { x: (CFG.mapWidth * 0.75) - 300, y: 200, w: 300, h: 100 },
      { x: (CFG.mapWidth * 0.75) - 300, y: CFG.mapHeight - 300, w: 300, h: 100 },
      { x: (CFG.mapWidth / 2) - 300, y: (CFG.mapHeight / 2) - 50, w: 100, h: 100 },
      { x: (CFG.mapWidth / 2) + 200, y: (CFG.mapHeight / 2) - 50, w: 100, h: 100 },
    ];
  }

  startMatch(hero: HeroKey) {
    this.selectedHero = hero;
    this.entities = [];
    this.projectiles = [];
    this.particles = [];
    this.texts = [];
    this.scores = { 0: 0, 1: 0 };
    this.timeLeft = CFG.timeLimit;
    this.killId = 0;

    this.player = new Character(this, CFG.mapWidth / 4, CFG.mapHeight / 2, 0, hero, true);
    this.entities.push(this.player);

    const roles = (Object.keys(HERO_DEFS) as HeroKey[]).filter((key) => key !== hero);
    this.entities.push(new Character(this, CFG.mapWidth / 4, (CFG.mapHeight / 2) - 150, 0, roles[0] ?? 'STRIKER'));
    this.entities.push(new Character(this, CFG.mapWidth / 4, (CFG.mapHeight / 2) + 150, 0, roles[1] ?? 'SERAPH'));
    this.entities.push(new Character(this, CFG.mapWidth * 0.75, CFG.mapHeight / 2, 1, 'TITAN'));
    this.entities.push(new Character(this, CFG.mapWidth * 0.75, (CFG.mapHeight / 2) - 150, 1, 'STRIKER'));
    this.entities.push(new Character(this, CFG.mapWidth * 0.75, (CFG.mapHeight / 2) + 150, 1, 'SERAPH'));
    this.entities.forEach((entity) => entity.respawn());

    this.state = 'playing';
    this.camera = new Vec2();
    this.updateHud();
  }

  quitToMenu() {
    this.state = 'title';
    this.callbacks.onPauseChange(false);
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.callbacks.onPauseChange(true);
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.callbacks.onPauseChange(false);
    }
  }

  addScore(team: 0 | 1, value: number) {
    this.scores[team] += value;
    haptic(team === 0 ? 'score-up' : 'danger');
    if (this.scores[team] >= CFG.scoreLimit) {
      this.endMatch(team === 0);
    }
  }

  endMatch(victory: boolean) {
    this.state = 'gameover';
    const blueScore = this.scores[0];
    const redScore = this.scores[1];
    stageComplete({
      stage: 0,
      score: blueScore,
      elapsedMs: Math.round((CFG.timeLimit - this.timeLeft) * 1000),
      cleared: victory,
    });
    this.callbacks.onGameOver({ victory, blueScore, redScore });
    this.callbacks.onPauseChange(false);
  }

  logKill(killer: Character, victim: Character) {
    this.callbacks.onKillFeed({
      id: ++this.killId,
      text: `${killer.heroDef.name} eliminated ${victim.heroDef.name}`,
      killerTeam: killer.team,
      victimTeam: victim.team,
    });
  }

  screenToWorld(screenPos: Vec2) {
    return new Vec2(screenPos.x + this.camera.x, screenPos.y + this.camera.y);
  }

  cameraShake(amount: number) {
    this.shake = Math.max(this.shake, amount);
  }

  shootProjectile(owner: Character, target: Vec2, speed: number, dmg: number, radius: number, lifetime: number, color: string, isAoe = false, smart = false) {
    const dir = target.sub(owner.pos).normalize();
    const projectile = new Projectile(
      owner.pos.x + (dir.x * (owner.radius + 5)),
      owner.pos.y + (dir.y * (owner.radius + 5)),
      dir,
      speed,
      dmg,
      radius,
      color,
      isAoe,
      smart,
      owner,
    );
    projectile.lifetime = lifetime;
    this.projectiles.push(projectile);
    this.spawnParticles(owner.pos.add(dir.mult(owner.radius)), color, 3);
  }

  shootSpread(owner: Character, target: Vec2, count: number, dmg: number, speed: number, spreadAngle: number) {
    const baseDir = target.sub(owner.pos).normalize();
    const baseAngle = Math.atan2(baseDir.y, baseDir.x);
    for (let index = 0; index < count; index += 1) {
      const angle = baseAngle + ((Math.random() - 0.5) * (spreadAngle * Math.PI / 180));
      const dir = new Vec2(Math.cos(angle), Math.sin(angle));
      const projectile = new Projectile(
        owner.pos.x + (dir.x * (owner.radius + 5)),
        owner.pos.y + (dir.y * (owner.radius + 5)),
        dir,
        speed,
        dmg,
        4,
        '#f59e0b',
        false,
        false,
        owner,
      );
      projectile.lifetime = 0.8;
      this.projectiles.push(projectile);
    }
    this.spawnParticles(owner.pos.add(baseDir.mult(owner.radius)), '#f59e0b', 5);
  }

  shootGrenade(owner: Character, target: Vec2) {
    const dir = target.sub(owner.pos).normalize();
    const projectile = new Projectile(owner.pos.x, owner.pos.y, dir, 400, 60, 6, '#fff', true, false, owner);
    projectile.bounces = 1;
    projectile.lifetime = 1.5;
    this.projectiles.push(projectile);
  }

  aoeAttack(owner: Character, pos: Vec2, radius: number, dmg: number, push = false, stunSeconds = 0) {
    this.spawnParticles(pos, owner.team === 0 ? CFG.blueColor : CFG.redColor, 30);
    this.entities.forEach((entity) => {
      if (entity.active && entity.team !== owner.team && entity.pos.dist(pos) < radius + entity.radius) {
        entity.takeDamage(dmg, { owner });
        if (push) {
          const dir = entity.pos.sub(pos).normalize();
          entity.vel = entity.vel.add(dir.mult(500));
        }
        if (stunSeconds) entity.addBuff('stun', stunSeconds, {});
      }
    });
  }

  aoeHeal(owner: Character, pos: Vec2, radius: number, amount: number, burst = true) {
    if (burst) this.spawnParticles(pos, '#10b981', 30);
    this.entities.forEach((entity) => {
      if (entity.active && entity.team === owner.team && entity.pos.dist(pos) < radius + entity.radius) {
        entity.heal(amount);
      }
    });
  }

  aoeBuff(owner: Character, pos: Vec2, radius: number, type: string, duration: number, data: Record<string, number>) {
    this.spawnParticles(pos, '#60a5fa', 20);
    this.entities.forEach((entity) => {
      if (entity.active && entity.team === owner.team && entity.pos.dist(pos) < radius + entity.radius) {
        entity.addBuff(type, duration, data);
      }
    });
  }

  spawnParticles(pos: Vec2, color: string, count: number) {
    for (let index = 0; index < count; index += 1) {
      this.particles.push(new Particle(pos.x, pos.y, color));
    }
  }

  spawnText(x: number, y: number, text: string, color: string) {
    this.texts.push(new FloatingText(x, y, text, color));
  }

  resolveCircleRect(circle: GameObject, rect: { x: number; y: number; w: number; h: number }) {
    let testX = circle.pos.x;
    let testY = circle.pos.y;
    if (circle.pos.x < rect.x) testX = rect.x;
    else if (circle.pos.x > rect.x + rect.w) testX = rect.x + rect.w;
    if (circle.pos.y < rect.y) testY = rect.y;
    else if (circle.pos.y > rect.y + rect.h) testY = rect.y + rect.h;

    const distX = circle.pos.x - testX;
    const distY = circle.pos.y - testY;
    const dist = Math.sqrt((distX * distX) + (distY * distY));

    if (dist <= circle.radius) {
      let normal = new Vec2(distX, distY).normalize();
      if (dist === 0) normal = new Vec2(0, -1);
      const overlap = circle.radius - dist;
      circle.pos = circle.pos.add(normal.mult(overlap));
      const dot = (circle.vel.x * normal.x) + (circle.vel.y * normal.y);
      circle.vel.x -= dot * normal.x;
      circle.vel.y -= dot * normal.y;
    }
  }

  hasLineOfSight(p1: Vec2, p2: Vec2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt((dx * dx) + (dy * dy));
    if (dist === 0) return true;
    const nx = dx / dist;
    const ny = dy / dist;
    const steps = dist / 20;
    for (let index = 0; index < steps; index += 1) {
      const cx = p1.x + (nx * (index * 20));
      const cy = p1.y + (ny * (index * 20));
      for (const wall of this.walls) {
        if (cx > wall.x && cx < wall.x + wall.w && cy > wall.y && cy < wall.y + wall.h) return false;
      }
    }
    return true;
  }

  updateAI(bot: Character, dt: number) {
    if (!bot.active) return;
    if (bot.buffs.find((buff) => buff.type === 'stun')) return;

    bot.aiTimer -= dt;
    const allies = this.entities.filter((entity) => entity.active && entity.team === bot.team && entity !== bot);
    const enemies = this.entities.filter((entity) => entity.active && entity.team !== bot.team);

    let enemy: Character | null = null;
    let enemyDist = Number.POSITIVE_INFINITY;
    enemies.forEach((candidate) => {
      const dist = bot.pos.dist(candidate.pos);
      if (dist < enemyDist && this.hasLineOfSight(bot.pos, candidate.pos)) {
        enemy = candidate;
        enemyDist = dist;
      }
    });

    const isSupport = bot.heroDef.role === 'Support';
    let healTarget: Character | null = null;
    if (isSupport) {
      let lowestHpRatio = 0.8;
      allies.forEach((ally) => {
        const ratio = ally.hp / ally.maxHp;
        if (ratio < lowestHpRatio && this.hasLineOfSight(bot.pos, ally.pos)) {
          healTarget = ally;
          lowestHpRatio = ratio;
        }
      });
    }

    let aimTarget: Vec2 | null = null;
    let moveTarget: Vec2 | null = null;
    let idealDist = bot.heroDef.role === 'Tank' ? 100 : bot.heroDef.role === 'Damage' ? 400 : 300;

    if (isSupport && healTarget) {
      aimTarget = healTarget.pos;
      moveTarget = healTarget.pos;
      idealDist = 200;
      if (bot.cds.secondary <= 0 && bot.pos.dist(healTarget.pos) < 200) bot.useSkill('secondary', bot.pos);
      if (bot.cds.primary <= 0) bot.useSkill('primary', aimTarget);
      if (bot.ultCharge >= bot.heroDef.skills.ultimate.cost) bot.useSkill('ultimate', bot.pos);
    } else if (enemy) {
      aimTarget = enemy.pos;
      moveTarget = enemy.pos;
      if (bot.cds.primary <= 0) bot.useSkill('primary', aimTarget);
      if (enemyDist < 500 && Math.random() < 0.05) bot.useSkill('secondary', aimTarget);
      if (enemyDist > 300 && bot.heroDef.role === 'Tank') bot.useSkill('utility', aimTarget);
      if (enemyDist < 200 && bot.heroDef.role === 'Tank') bot.useSkill('special', aimTarget);
      if (bot.ultCharge >= bot.heroDef.skills.ultimate.cost && enemyDist < 400) bot.useSkill('ultimate', aimTarget);
    }

    if (bot.aiTimer <= 0) {
      bot.aiTimer = 0.5 + (Math.random() * 0.5);
      if (!moveTarget) {
        bot.navPoint = bot.pos.add(new Vec2(rand(-300, 300), rand(-300, 300)));
      } else if (enemyDist < idealDist - 50) {
        bot.navPoint = bot.pos.sub(moveTarget.sub(bot.pos).normalize().mult(100));
      } else if (enemyDist > idealDist + 50) {
        bot.navPoint = moveTarget.clone();
      } else {
        const dir = moveTarget.sub(bot.pos).normalize();
        const perp = new Vec2(-dir.y, dir.x).mult(Math.random() > 0.5 ? 1 : -1);
        bot.navPoint = bot.pos.add(perp.mult(200));
      }
    }

    if (bot.navPoint) {
      let dir = bot.navPoint.sub(bot.pos);
      if (dir.mag() > 10) {
        dir = dir.normalize();
        bot.vel = bot.vel.add(dir.mult(bot.speed * dt * 5));
      }
    }

    if (aimTarget) {
      const dir = aimTarget.sub(bot.pos);
      bot.targetAngle = Math.atan2(dir.y, dir.x);
    } else if (bot.vel.mag() > 10) {
      bot.targetAngle = Math.atan2(bot.vel.y, bot.vel.x);
    }

    const speedBuff = bot.buffs.find((buff) => buff.type === 'speed');
    const maxSpeed = bot.speed * (speedBuff?.data.mult ?? 1);
    if (bot.vel.mag() > maxSpeed && !bot.buffs.find((buff) => buff.type === 'dr')) {
      bot.vel = bot.vel.normalize().mult(maxSpeed);
    }
    bot.vel = bot.vel.mult(0.9);
  }

  updatePlayer(dt: number) {
    if (!this.player || !this.player.active) return;
    if (this.player.buffs.find((buff) => buff.type === 'stun')) return;

    let moveDir = new Vec2();
    if (this.input.keys.w) moveDir.y -= 1;
    if (this.input.keys.s) moveDir.y += 1;
    if (this.input.keys.a) moveDir.x -= 1;
    if (this.input.keys.d) moveDir.x += 1;

    if (moveDir.mag() > 0) {
      moveDir = moveDir.normalize();
      const speedMult = this.player.buffs.find((buff) => buff.type === 'speed')?.data.mult ?? 1;
      this.player.vel = this.player.vel.add(moveDir.mult(this.player.speed * speedMult * dt * 10));
    }

    const isDashing = this.player.vel.mag() > this.player.speed * 1.5;
    if (!isDashing) {
      const limit = this.player.speed * (this.player.buffs.find((buff) => buff.type === 'speed') ? 1.5 : 1);
      if (this.player.vel.mag() > limit) this.player.vel = this.player.vel.normalize().mult(limit);
    }
    this.player.vel = this.player.vel.mult(0.85);

    const worldMouse = this.screenToWorld(this.input.mousePos);
    const aimDir = worldMouse.sub(this.player.pos);
    this.player.targetAngle = Math.atan2(aimDir.y, aimDir.x);

    if (this.input.m1) this.player.useSkill('primary', worldMouse);
    if (this.input.m2) this.player.useSkill('secondary', worldMouse);
    if (this.input.keys.shift) this.player.useSkill('utility', worldMouse);
    if (this.input.keys.e) this.player.useSkill('special', worldMouse);
    if (this.input.keys.q) this.player.useSkill('ultimate', worldMouse);
  }

  update(dt: number) {
    if (this.state !== 'playing') return;

    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.endMatch(this.scores[0] >= this.scores[1]);
      return;
    }

    this.updatePlayer(dt);

    this.entities.forEach((entity) => {
      if (!entity.isPlayer) this.updateAI(entity, dt);
      if (entity.updateStats(dt)) {
        entity.update(dt);
        entity.pos.x = clamp(entity.pos.x, entity.radius, CFG.mapWidth - entity.radius);
        entity.pos.y = clamp(entity.pos.y, entity.radius, CFG.mapHeight - entity.radius);
        this.walls.forEach((wall) => this.resolveCircleRect(entity, wall));
      }
    });

    for (let left = 0; left < this.entities.length; left += 1) {
      for (let right = left + 1; right < this.entities.length; right += 1) {
        const a = this.entities[left];
        const b = this.entities[right];
        if (!a.active || !b.active) continue;
        const dist = a.pos.dist(b.pos);
        const minDist = a.radius + b.radius;
        if (dist < minDist) {
          const pushDir = dist === 0 ? new Vec2(1, 0) : a.pos.sub(b.pos).normalize();
          const push = pushDir.mult(minDist - dist);
          a.pos = a.pos.add(push.mult(0.5));
          b.pos = b.pos.sub(push.mult(0.5));
        }
      }
    }

    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.projectiles[index];
      projectile.update(dt);
      let hit = false;

      for (const wall of this.walls) {
        if (projectile.pos.x > wall.x && projectile.pos.x < wall.x + wall.w && projectile.pos.y > wall.y && projectile.pos.y < wall.y + wall.h) {
          if (projectile.bounces > 0) {
            projectile.bounces -= 1;
            const left = projectile.pos.x - wall.x;
            const right = (wall.x + wall.w) - projectile.pos.x;
            const top = projectile.pos.y - wall.y;
            const bottom = (wall.y + wall.h) - projectile.pos.y;
            const min = Math.min(left, right, top, bottom);
            if (min === left || min === right) projectile.vel.x *= -1;
            else projectile.vel.y *= -1;
            projectile.pos = projectile.pos.add(projectile.vel.mult(dt));
          } else {
            hit = true;
          }
          break;
        }
      }

      if (!hit) {
        for (const entity of this.entities) {
          if (!entity.active || entity === projectile.owner) continue;
          if (projectile.pos.dist(entity.pos) < projectile.radius + entity.radius) {
            if (projectile.smart) {
              if (entity.team === projectile.owner.team) entity.heal(projectile.dmg);
              else entity.takeDamage(projectile.dmg, { owner: projectile.owner });
              hit = true;
              break;
            }
            if (entity.team !== projectile.owner.team) {
              hit = true;
              if (projectile.isAoe) this.aoeAttack(projectile.owner, projectile.pos, projectile.radius * 3, projectile.dmg);
              else entity.takeDamage(projectile.dmg, { owner: projectile.owner });
              break;
            }
          }
        }
      }

      if (hit || !projectile.active) {
        if (projectile.isAoe && !hit) this.aoeAttack(projectile.owner, projectile.pos, projectile.radius * 3, projectile.dmg);
        this.spawnParticles(projectile.pos, projectile.color, 10);
        this.projectiles.splice(index, 1);
      }
    }

    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      this.particles[index].update(dt);
      if (this.particles[index].life <= 0) this.particles.splice(index, 1);
    }

    for (let index = this.texts.length - 1; index >= 0; index -= 1) {
      this.texts[index].update(dt);
      if (this.texts[index].life <= 0) this.texts.splice(index, 1);
    }

    if (this.player?.active) {
      const viewWidth = this.canvas.clientWidth || window.innerWidth;
      const viewHeight = this.canvas.clientHeight || window.innerHeight;
      let targetCamX = this.player.pos.x - (viewWidth / 2);
      let targetCamY = this.player.pos.y - (viewHeight / 2);
      const mouseOffset = this.input.mousePos.sub(new Vec2(viewWidth / 2, viewHeight / 2)).mult(0.2);
      targetCamX += mouseOffset.x;
      targetCamY += mouseOffset.y;
      targetCamX = clamp(targetCamX, 0, CFG.mapWidth - viewWidth);
      targetCamY = clamp(targetCamY, 0, CFG.mapHeight - viewHeight);
      this.camera.x += (targetCamX - this.camera.x) * 5 * dt;
      this.camera.y += (targetCamY - this.camera.y) * 5 * dt;
    }

    if (this.shake > 0) {
      this.shake -= dt * 30;
      if (this.shake < 0) this.shake = 0;
    }

    this.updateHud();
  }

  updateHud() {
    const player = this.player;
    if (!player) return;
    this.callbacks.onHudUpdate({
      timeLeft: this.timeLeft,
      scores: { blue: this.scores[0], red: this.scores[1] },
      hp: player.hp,
      maxHp: player.maxHp,
      respawnTimer: player.respawnTimer,
      cds: { ...player.cds },
      skillMax: {
        primary: player.heroDef.skills.primary.cd,
        secondary: player.heroDef.skills.secondary.cd,
        utility: player.heroDef.skills.utility.cd,
        special: player.heroDef.skills.special.cd,
      },
      ultCharge: player.ultCharge,
      ultCost: player.heroDef.skills.ultimate.cost,
      active: player.active,
    });
  }

  draw() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.ctx.fillStyle = '#081120';
    this.ctx.fillRect(0, 0, width, height);

    if (!['playing', 'paused', 'gameover'].includes(this.state)) return;

    this.ctx.save();
    const shakeX = this.shake > 0 ? rand(-this.shake, this.shake) : 0;
    const shakeY = this.shake > 0 ? rand(-this.shake, this.shake) : 0;
    this.ctx.translate(-this.camera.x + shakeX, -this.camera.y + shakeY);

    const floor = this.ctx.createLinearGradient(0, 0, CFG.mapWidth, CFG.mapHeight);
    floor.addColorStop(0, '#081120');
    floor.addColorStop(1, '#0f1f3d');
    this.ctx.fillStyle = floor;
    this.ctx.fillRect(0, 0, CFG.mapWidth, CFG.mapHeight);

    this.ctx.strokeStyle = 'rgba(96, 165, 250, 0.08)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    const grid = 100;
    for (let x = 0; x <= CFG.mapWidth; x += grid) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, CFG.mapHeight);
    }
    for (let y = 0; y <= CFG.mapHeight; y += grid) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(CFG.mapWidth, y);
    }
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(59, 130, 246, 0.09)';
    this.ctx.fillRect(this.map.blueSpawn.x, this.map.blueSpawn.y, this.map.blueSpawn.w, this.map.blueSpawn.h);
    this.ctx.fillStyle = 'rgba(239, 68, 68, 0.09)';
    this.ctx.fillRect(this.map.redSpawn.x, this.map.redSpawn.y, this.map.redSpawn.w, this.map.redSpawn.h);

    this.ctx.fillStyle = '#1e293b';
    this.ctx.strokeStyle = '#334155';
    this.ctx.lineWidth = 4;
    this.walls.forEach((wall) => {
      this.ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      this.ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
    });

    const renderables = [...this.entities, ...this.projectiles].sort((a, b) => a.pos.y - b.pos.y);
    renderables.forEach((item) => {
      if ('draw' in item) item.draw(this.ctx);
    });
    this.particles.forEach((particle) => particle.draw(this.ctx));
    this.texts.forEach((text) => text.draw(this.ctx));

    if (this.state === 'playing') {
      const cx = this.input.mousePos.x + this.camera.x - shakeX;
      const cy = this.input.mousePos.y + this.camera.y - shakeY;
      this.ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(cx - 10, cy);
      this.ctx.lineTo(cx + 10, cy);
      this.ctx.moveTo(cx, cy - 10);
      this.ctx.lineTo(cx, cy + 10);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  loop(time: number) {
    let dt = (time - this.lastTime) / 1000;
    this.lastTime = time;
    if (dt > 0.1) dt = 0.1;
    if (this.state === 'playing') this.update(dt);
    this.draw();
    this.animationId = window.requestAnimationFrame(this.loop);
  }
}

const initialHud: HudState = {
  timeLeft: CFG.timeLimit,
  scores: { blue: 0, red: 0 },
  hp: 0,
  maxHp: 0,
  respawnTimer: 0,
  cds: { primary: 0, secondary: 0, utility: 0, special: 0 },
  skillMax: { primary: 1, secondary: 1, utility: 1, special: 1 },
  ultCharge: 0,
  ultCost: 1,
  active: false,
};

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function ArenaGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const inputRef = useRef<InputState>({
    keys: {},
    mousePos: new Vec2(0, 0),
    m1: false,
    m2: false,
  });

  const [screen, setScreen] = useState<ScreenState>('title');
  const [selectedHero, setSelectedHero] = useState<HeroKey | null>(null);
  const [hud, setHud] = useState<HudState>(initialHud);
  const [gameOver, setGameOver] = useState<GameOverState | null>(null);
  const [killFeed, setKillFeed] = useState<Array<{ id: number; text: string; killerTeam: 0 | 1; victimTeam: 0 | 1 }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const engine = new GameEngine(canvas, inputRef.current, {
      onHudUpdate: setHud,
      onGameOver: (state) => {
        setGameOver(state);
        setScreen('gameover');
      },
      onPauseChange: (paused) => {
        setScreen(paused ? 'paused' : 'playing');
      },
      onKillFeed: (entry) => {
        setKillFeed((prev) => [...prev, entry]);
        window.setTimeout(() => {
          setKillFeed((prev) => prev.filter((item) => item.id !== entry.id));
        }, 3000);
      },
    });
    engineRef.current = engine;

    const handleResize = () => {
      engine.resize();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      inputRef.current.keys[event.key.toLowerCase()] = true;
      if (event.key === 'Escape') {
        if (engine.state === 'playing' || engine.state === 'paused') {
          engine.togglePause();
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      inputRef.current.keys[event.key.toLowerCase()] = false;
    };

    const updateMouse = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      inputRef.current.mousePos = new Vec2(event.clientX - rect.left, event.clientY - rect.top);
    };

    const handleMouseDown = (event: MouseEvent) => {
      updateMouse(event);
      if (event.button === 0) inputRef.current.m1 = true;
      if (event.button === 2) inputRef.current.m2 = true;
    };

    const handleMouseUp = (event: MouseEvent) => {
      updateMouse(event);
      if (event.button === 0) inputRef.current.m1 = false;
      if (event.button === 2) inputRef.current.m2 = false;
    };

    const handleMouseMove = (event: MouseEvent) => {
      updateMouse(event);
    };

    const preventContext = (event: Event) => event.preventDefault();

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', preventContext);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('contextmenu', preventContext);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const heroCards = useMemo(() => Object.values(HERO_DEFS), []);

  const startMatch = () => {
    if (!selectedHero) return;
    setKillFeed([]);
    setGameOver(null);
    setScreen('playing');
    engineRef.current?.startMatch(selectedHero);
  };

  const showHeroSelect = () => {
    setScreen('select');
  };

  const showTitle = () => {
    inputRef.current.keys = {};
    inputRef.current.m1 = false;
    inputRef.current.m2 = false;
    setKillFeed([]);
    setGameOver(null);
    setHud(initialHud);
    setScreen('title');
    engineRef.current?.quitToMenu();
  };

  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        minHeight: 0,
        background: 'radial-gradient(circle at top, #15315b 0%, #081120 55%, #050b15 100%)',
        overflow: 'hidden',
        color: '#f8fafc',
        fontFamily: '"Segoe UI", system-ui, sans-serif',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: screen === 'playing' ? 'none' : 'default',
        }}
      />

      {screen === 'title' && (
        <Overlay>
          <Title>Neon Vanguard</Title>
          <p style={{ marginBottom: 32, fontSize: 18, color: '#94a3b8', letterSpacing: 1.2 }}>Team-based tactical arena</p>
          <PrimaryButton onClick={showHeroSelect}>Play Now</PrimaryButton>
        </Overlay>
      )}

      {screen === 'select' && (
        <Overlay>
          <SectionTitle>Select Your Hero</SectionTitle>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: 1024 }}>
            {heroCards.map((hero) => {
              const isSelected = selectedHero === hero.name;
              return (
                <button
                  key={hero.name}
                  type="button"
                  onClick={() => setSelectedHero(hero.name)}
                  style={{
                    width: '100%',
                    maxWidth: 300,
                    background: 'rgba(15, 23, 42, 0.92)',
                    color: '#e2e8f0',
                    border: isSelected ? '2px solid #10b981' : '2px solid #334155',
                    borderRadius: 18,
                    padding: 22,
                    textAlign: 'left',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 28px rgba(16, 185, 129, 0.35)' : '0 18px 40px rgba(2, 6, 23, 0.34)',
                    transform: isSelected ? 'translateY(-4px)' : 'none',
                  }}
                >
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{hero.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: hero.color, margin: '8px 0 14px' }}>{hero.role}</div>
                  <p style={{ fontSize: 14, lineHeight: 1.5, color: '#cbd5e1', marginBottom: 14 }}>{hero.desc}</p>
                  <div style={{ display: 'grid', gap: 6, fontSize: 13, color: '#cbd5e1' }}>
                    <div><strong style={{ color: '#fff' }}>HP:</strong> {hero.hp}</div>
                    <div><strong style={{ color: '#fff' }}>LMB:</strong> {hero.skills.primary.name}</div>
                    <div><strong style={{ color: '#fff' }}>RMB:</strong> {hero.skills.secondary.name}</div>
                    <div><strong style={{ color: '#fff' }}>SHIFT:</strong> {hero.skills.utility.name}</div>
                    <div><strong style={{ color: '#fff' }}>E:</strong> {hero.skills.special.name}</div>
                    <div><strong style={{ color: '#fff' }}>Q:</strong> {hero.skills.ultimate.name}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
            <PrimaryButton onClick={startMatch} disabled={!selectedHero}>
              Start Match
            </PrimaryButton>
            <GhostButton onClick={showTitle}>Back</GhostButton>
          </div>
        </Overlay>
      )}

      {(screen === 'playing' || screen === 'paused' || screen === 'gameover') && (
        <>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '20px 28px',
                fontSize: 24,
                fontWeight: 800,
                background: 'linear-gradient(180deg, rgba(2, 6, 23, 0.92), rgba(2, 6, 23, 0))',
              }}
            >
              <div>{formatTime(hud.timeLeft)}</div>
              <div style={{ display: 'flex', gap: 28 }}>
                <span style={{ color: CFG.blueColor, textShadow: '0 0 14px rgba(59,130,246,0.7)' }}>BLUE: {hud.scores.blue}</span>
                <span style={{ color: CFG.redColor, textShadow: '0 0 14px rgba(239,68,68,0.7)' }}>RED: {hud.scores.red}</span>
              </div>
            </div>

            <div style={{ position: 'absolute', top: 82, right: 20, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', maxWidth: 320 }}>
              {killFeed.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: 'rgba(2, 6, 23, 0.72)',
                    border: '1px solid rgba(148,163,184,0.22)',
                    fontSize: 14,
                    color: '#e2e8f0',
                    boxShadow: '0 8px 20px rgba(2, 6, 23, 0.32)',
                  }}
                >
                  <span style={{ color: entry.killerTeam === 0 ? CFG.blueColor : CFG.redColor, fontWeight: 800 }}>{entry.text.split(' eliminated ')[0]}</span>
                  <span style={{ color: '#cbd5e1' }}> eliminated </span>
                  <span style={{ color: entry.victimTeam === 0 ? CFG.blueColor : CFG.redColor, fontWeight: 800 }}>{entry.text.split(' eliminated ')[1]}</span>
                </div>
              ))}
            </div>

            <div style={{ position: 'absolute', left: '50%', bottom: 20, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: 'min(92vw, 460px)' }}>
              <div style={{ width: '100%', height: 24, background: 'rgba(2, 6, 23, 0.72)', border: '2px solid #334155', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
                <div style={{ width: hud.active ? `${(hud.hp / Math.max(hud.maxHp, 1)) * 100}%` : '0%', height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, textShadow: '0 1px 2px #000' }}>
                  {hud.active ? `${Math.ceil(hud.hp)} / ${hud.maxHp}` : `Respawning in ${Math.ceil(hud.respawnTimer)}`}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center' }}>
                {([
                  { id: 'primary', keyLabel: 'LMB', name: 'Prim', color: '#93c5fd' },
                  { id: 'secondary', keyLabel: 'RMB', name: 'Sec', color: '#fda4af' },
                  { id: 'utility', keyLabel: 'SHIFT', name: 'Util', color: '#86efac' },
                  { id: 'special', keyLabel: 'E', name: 'Spec', color: '#c4b5fd' },
                ] as const).map((skill) => {
                  const currentCd = hud.cds[skill.id];
                  const maxCd = Math.max(hud.skillMax[skill.id], 0.001);
                  const percent = currentCd > 0 ? (currentCd / maxCd) * 100 : 0;
                  return (
                    <SkillIcon
                      key={skill.id}
                      keyLabel={skill.keyLabel}
                      name={skill.name}
                      accent={skill.color}
                      cooldownPct={percent}
                      cooldownText={currentCd > 0 ? `${Math.ceil(currentCd)}` : ''}
                    />
                  );
                })}
                <SkillIcon
                  keyLabel="Q"
                  name="ULT"
                  accent="#facc15"
                  cooldownPct={0}
                  cooldownText=""
                  ultPct={hud.ultCharge / Math.max(hud.ultCost, 1)}
                  highlight={hud.ultCharge >= hud.ultCost}
                />
              </div>
            </div>
          </div>

          {screen === 'paused' && (
            <Overlay>
              <SectionTitle>Paused</SectionTitle>
              <p style={{ marginBottom: 24, fontSize: 16, color: '#cbd5e1' }}>Press ESC to resume</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <PrimaryButton onClick={() => engineRef.current?.togglePause()}>Resume</PrimaryButton>
                <GhostButton onClick={showTitle}>Quit to Menu</GhostButton>
              </div>
            </Overlay>
          )}

          {screen === 'gameover' && gameOver && (
            <Overlay>
              <Title style={{ color: gameOver.victory ? CFG.blueColor : CFG.redColor }}>
                {gameOver.victory ? 'Victory' : 'Defeat'}
              </Title>
              <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 28 }}>
                <span style={{ color: CFG.blueColor }}>{gameOver.blueScore}</span>
                <span style={{ color: '#e2e8f0', margin: '0 12px' }}>:</span>
                <span style={{ color: CFG.redColor }}>{gameOver.redScore}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <PrimaryButton onClick={showHeroSelect}>Play Again</PrimaryButton>
                <GhostButton onClick={showTitle}>Return to Menu</GhostButton>
              </div>
            </Overlay>
          )}
        </>
      )}
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'rgba(4, 10, 22, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 10,
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  );
}

function Title({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <h1
      style={{
        fontSize: 'clamp(3rem, 8vw, 5rem)',
        margin: 0,
        marginBottom: 12,
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: 4,
        textShadow: '0 0 24px rgba(59,130,246,0.65)',
        ...style,
      }}
    >
      {children}
    </h1>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', margin: '0 0 24px', color: '#fff' }}>{children}</h2>;
}

function PrimaryButton({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '15px 40px',
        fontSize: 18,
        fontWeight: 800,
        textTransform: 'uppercase',
        background: disabled ? 'rgba(51, 65, 85, 0.8)' : '#2563eb',
        color: '#fff',
        border: '2px solid rgba(147, 197, 253, 0.75)',
        borderRadius: 14,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : '0 0 24px rgba(37, 99, 235, 0.42)',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '15px 32px',
        fontSize: 16,
        fontWeight: 700,
        background: 'rgba(15, 23, 42, 0.88)',
        color: '#e2e8f0',
        border: '1px solid rgba(148, 163, 184, 0.35)',
        borderRadius: 14,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function SkillIcon({
  keyLabel,
  name,
  accent,
  cooldownPct,
  cooldownText,
  ultPct,
  highlight,
}: {
  keyLabel: string;
  name: string;
  accent: string;
  cooldownPct: number;
  cooldownText: string;
  ultPct?: number;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        width: 62,
        height: 62,
        borderRadius: 14,
        position: 'relative',
        overflow: 'hidden',
        background: 'rgba(15, 23, 42, 0.82)',
        border: `2px solid ${highlight ? '#facc15' : 'rgba(71, 85, 105, 0.9)'}`,
        boxShadow: highlight ? '0 0 18px rgba(250, 204, 21, 0.42)' : 'none',
      }}
    >
      {typeof ultPct === 'number' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: 'bottom',
            transform: `scaleY(${clamp(ultPct, 0, 1)})`,
            background: 'rgba(250, 204, 21, 0.28)',
          }}
        />
      )}
      <div style={{ position: 'absolute', top: 4, left: 6, fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>{keyLabel}</div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: accent, letterSpacing: 0.3 }}>
        {name}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: `${cooldownPct}%`,
          background: 'rgba(2, 6, 23, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 18,
          fontWeight: 800,
        }}
      >
        {cooldownText}
      </div>
    </div>
  );
}
