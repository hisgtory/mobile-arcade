import { HeroDef, Team, Wall, Zone, SpawnPoint } from './types';
import { MathUtils, MapConfig, HeroClasses } from './logic/constants';

// --- Events ---
type GameEvent = 
  | { type: 'score-update'; data: { blue: number; red: number } }
  | { type: 'zone-update'; data: { control: number } }
  | { type: 'player-update'; data: { hp: number; maxHp: number; ultCharge: number; dead: boolean; respawnTimer: number } }
  | { type: 'kill'; data: { killer: string; victim: string; team: Team } }
  | { type: 'game-over'; data: { winner: string; blueScore: number; redScore: number } };

type GameEventListener = (event: GameEvent) => void;

export class HeroArenaGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLElement;
  private lastTime: number = 0;
  private state: 'PLAYING' | 'GAMEOVER' = 'PLAYING';
  private camera = { x: 0, y: 0, shakeTime: 0, shakeMag: 0 };
  
  public players: Character[] = [];
  public projectiles: Projectile[] = [];
  public particles: any[] = [];
  public shields: any[] = [];
  public texts: any[] = [];
  
  public myPlayer: Character | null = null;
  public score = { blue: 0, red: 0 };
  public zoneControl: number = 0;
  private captureSpeed = 5;
  private maxScore = 100;
  
  private keys: Record<string, boolean> = {};
  private mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false };
  private listeners: GameEventListener[] = [];
  private animationFrameId: number | null = null;

  constructor(container: HTMLElement, selectedHero: HeroDef) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    container.appendChild(this.canvas);
    
    this.resize();
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);

    this.initGame(selectedHero);
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  private handleResize = () => this.resize();
  private handleKeyDown = (e: KeyboardEvent) => this.keys[e.key.toLowerCase()] = true;
  private handleKeyUp = (e: KeyboardEvent) => this.keys[e.key.toLowerCase()] = false;
  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
  };
  private handleMouseDown = (e: MouseEvent) => { if(e.button===0) this.mouse.down = true; };
  private handleMouseUp = (e: MouseEvent) => { if(e.button===0) this.mouse.down = false; };

  private resize() {
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
  }

  private initGame(selectedHero: HeroDef) {
    this.myPlayer = new Character(selectedHero, 'blue', true, this);
    this.players.push(this.myPlayer);

    // Spawn Bots
    this.players.push(new Character(HeroClasses.TITAN, 'blue', false, this));
    this.players.push(new Character(HeroClasses.AURA, 'blue', false, this));
    this.players.push(new Character(HeroClasses.WRAITH, 'blue', false, this));
    this.players.push(new Character(HeroClasses.WRAITH, 'blue', false, this));

    this.players.push(new Character(HeroClasses.TITAN, 'red', false, this));
    this.players.push(new Character(HeroClasses.WRAITH, 'red', false, this));
    this.players.push(new Character(HeroClasses.WRAITH, 'red', false, this));
    this.players.push(new Character(HeroClasses.AURA, 'red', false, this));
    this.players.push(new Character(HeroClasses.AURA, 'red', false, this));
  }

  public on(listener: GameEventListener) {
    this.listeners.push(listener);
  }

  private emit(event: GameEvent) {
    this.listeners.forEach(l => l(event));
  }

  private loop = (timestamp: number) => {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    if (this.state === 'PLAYING') {
      this.update(dt);
      this.draw();
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    if (this.myPlayer && !this.myPlayer.dead) {
      let dx = 0, dy = 0;
      if (this.keys['w']) dy -= 1;
      if (this.keys['s']) dy += 1;
      if (this.keys['a']) dx -= 1;
      if (this.keys['d']) dx += 1;
      
      if (dx !== 0 && dy !== 0) {
        const len = Math.sqrt(dx*dx + dy*dy);
        dx /= len; dy /= len;
      }
      this.myPlayer.inputMove(dx, dy);

      this.mouse.worldX = this.mouse.x + this.camera.x;
      this.mouse.worldY = this.mouse.y + this.camera.y;
      this.myPlayer.aimAngle = MathUtils.angle(this.myPlayer.x, this.myPlayer.y, this.mouse.worldX, this.mouse.worldY);

      if (this.mouse.down) this.myPlayer.useAbility('m1');
      if (this.keys['shift']) this.myPlayer.useAbility('shift');
      if (this.keys['e']) this.myPlayer.useAbility('e');
      if (this.keys['q']) this.myPlayer.useAbility('q');
    }

    if (this.myPlayer) {
      const targetX = this.myPlayer.x - this.canvas.width/2;
      const targetY = this.myPlayer.y - this.canvas.height/2;
      this.camera.x += (targetX - this.camera.x) * 5 * dt;
      this.camera.y += (targetY - this.camera.y) * 5 * dt;
      
      this.emit({
        type: 'player-update',
        data: {
          hp: this.myPlayer.hp,
          maxHp: this.myPlayer.hero.maxHp,
          ultCharge: this.myPlayer.ultCharge,
          dead: this.myPlayer.dead,
          respawnTimer: this.myPlayer.respawnTimer
        }
      });
    }

    if (this.camera.shakeTime > 0) this.camera.shakeTime -= dt;

    this.players.forEach(p => p.update(dt));
    
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);
      if (p.dead) this.projectiles.splice(i, 1);
    }

    for (let i = this.shields.length - 1; i >= 0; i--) {
      const s = this.shields[i];
      s.life -= dt;
      if (s.life <= 0 || s.hp <= 0) {
        this.spawnParticle(s.x, s.y, s.team==='blue'?'#0ff':'#f00', 20, 150, 0.5, 4);
        this.shields.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.y += t.vy * dt;
      t.life -= dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }

    this.updateObjective(dt);
  }

  private updateObjective(dt: number) {
    let blueInZone = 0, redInZone = 0;
    const z = MapConfig.zone;

    this.players.forEach(p => {
      if (!p.dead) {
        if (p.x > z.x && p.x < z.x+z.w && p.y > z.y && p.y < z.y+z.h) {
          if (p.team === 'blue') blueInZone++;
          else redInZone++;
        }
      }
    });

    if (blueInZone > 0 && redInZone > 0) {
    } else if (blueInZone > 0) {
      this.zoneControl = Math.min(100, this.zoneControl + this.captureSpeed * blueInZone * dt);
    } else if (redInZone > 0) {
      this.zoneControl = Math.max(-100, this.zoneControl - this.captureSpeed * redInZone * dt);
    } else {
      if (this.zoneControl > 0) this.zoneControl = Math.max(0, this.zoneControl - this.captureSpeed * 0.5 * dt);
      if (this.zoneControl < 0) this.zoneControl = Math.min(0, this.zoneControl + this.captureSpeed * 0.5 * dt);
    }

    if (this.zoneControl >= 100) {
      this.score.blue += 5 * dt;
      if (this.score.blue >= this.maxScore) this.endGame('Blue');
    } else if (this.zoneControl <= -100) {
      this.score.red += 5 * dt;
      if (this.score.red >= this.maxScore) this.endGame('Red');
    }

    this.emit({ type: 'score-update', data: this.score });
    this.emit({ type: 'zone-update', data: { control: this.zoneControl } });
  }

  private endGame(winner: string) {
    this.state = 'GAMEOVER';
    this.emit({ type: 'game-over', data: { winner, blueScore: this.score.blue, redScore: this.score.red } });
  }

  private draw() {
    const { ctx, camera, canvas } = this;
    ctx.fillStyle = '#0a0a10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    let cx = camera.x;
    let cy = camera.y;
    if (camera.shakeTime > 0) {
      cx += MathUtils.rand(-camera.shakeMag, camera.shakeMag);
      cy += MathUtils.rand(-camera.shakeMag, camera.shakeMag);
    }
    ctx.translate(-cx, -cy);

    // Map Zone
    const z = MapConfig.zone;
    ctx.fillStyle = this.zoneControl > 0 ? `rgba(0, 240, 255, ${0.1 + (this.zoneControl/100)*0.3})` : 
                    this.zoneControl < 0 ? `rgba(255, 42, 42, ${0.1 + (Math.abs(this.zoneControl)/100)*0.3})` : 
                    'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(z.x, z.y, z.w, z.h);
    
    // Walls
    ctx.fillStyle = '#222233';
    MapConfig.walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));

    this.players.sort((a,b) => a.y - b.y).forEach(p => p.draw(ctx));
    this.projectiles.forEach(p => p.draw(ctx));
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    this.texts.forEach(t => {
      ctx.globalAlpha = t.life / t.maxLife;
      ctx.fillStyle = t.color;
      ctx.font = `bold ${t.size}px sans-serif`;
      ctx.fillText(t.text, t.x, t.y);
    });
    ctx.restore();
  }

  public screenShake(mag: number, time: number) {
    this.camera.shakeMag = mag;
    this.camera.shakeTime = time;
  }

  public spawnParticle(x: number, y: number, color: string, count: number, speed=100, life=0.5, size=3) {
    for(let i=0; i<count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * speed;
      this.particles.push({
        x, y, vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd,
        color, life, maxLife: life, size: Math.random()*size + 1
      });
    }
  }

  public spawnText(x: number, y: number, text: string, color: string, isBig=false) {
    this.texts.push({
      x: x + MathUtils.rand(-10, 10), y: y - 20, 
      vy: -30, text, color, life: 1.0, maxLife: 1.0,
      size: isBig ? 24 : 14
    });
  }

  public addKillfeed(killer: string, victim: string, team: Team) {
    this.emit({ type: 'kill', data: { killer, victim, team } });
  }

  public destroy() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.remove();
  }
}

class Character {
    public x: number = 0; public y: number = 0;
    public vx: number = 0; public vy: number = 0;
    public hp: number;
    public aimAngle: number = 0;
    public dead: boolean = false;
    public respawnTimer: number = 0;
    public ultCharge: number = 0;
    public cooldowns: Record<string, number> = { m1: 0, shift: 0, e: 0, q: 0 };
    public radius: number;
    private stunTimer: number = 0;
    private dashTimer: number = 0;
    private speedMult: number = 1.0;
    private fireRateMult: number = 1.0;
    private repathTimer: number = 0;
    private aiState: string = 'IDLE';
    private target: Character | null = null;

    constructor(public hero: HeroDef, public team: Team, public isPlayer: boolean, private game: HeroArenaGame) {
        this.radius = hero.radius;
        this.hp = hero.maxHp;
        this.spawn();
    }

    spawn() {
        const spawnPt = MapConfig.spawns[this.team];
        this.x = spawnPt.x + MathUtils.rand(-50, 50);
        this.y = spawnPt.y + MathUtils.rand(-50, 50);
        this.hp = this.hero.maxHp;
        this.dead = false;
        this.ultCharge = 0;
    }

    takeDamage(amount: number, source?: Character) {
        if (this.dead) return;
        this.hp -= amount;
        this.game.spawnText(this.x, this.y, Math.floor(amount).toString(), '#fff');
        this.game.spawnParticle(this.x, this.y, '#f00', 5, 100, 0.3);
        if (source) source.addUltCharge(amount);
        if (this.hp <= 0) this.die(source);
    }

    addUltCharge(amount: number) {
        this.ultCharge = Math.min(this.hero.abilities.q.ultCost!, this.ultCharge + amount);
    }

    private die(killer?: Character) {
        this.dead = true;
        this.respawnTimer = 5.0;
        this.game.spawnParticle(this.x, this.y, this.hero.color, 30, 200, 1.0, 5);
        this.game.addKillfeed(killer ? (killer.isPlayer ? "Player" : killer.hero.name) : "Env", this.isPlayer ? "Player" : this.hero.name, killer ? killer.team : 'blue');
    }

    update(dt: number) {
        if (this.dead) {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0) this.spawn();
            return;
        }
        if (this.stunTimer > 0) { this.stunTimer -= dt; return; }
        if (this.dashTimer > 0) { this.dashTimer -= dt; }
        this.addUltCharge(2 * dt);
        for (let key in this.cooldowns) if (this.cooldowns[key] > 0) this.cooldowns[key] -= dt;
        if (!this.isPlayer) this.updateAI(dt);
        
        let intendedX = this.x + this.vx * dt;
        let intendedY = this.y + this.vy * dt;
        let hitWallX = false, hitWallY = false;
        for (let w of MapConfig.walls) {
            if (MathUtils.circleRectCollide(intendedX, this.y, this.radius, w.x, w.y, w.w, w.h)) hitWallX = true;
            if (MathUtils.circleRectCollide(this.x, intendedY, this.radius, w.x, w.y, w.w, w.h)) hitWallY = true;
        }
        if (!hitWallX) this.x = intendedX;
        if (!hitWallY) this.y = intendedY;
        this.vx *= 0.8; this.vy *= 0.8;
    }

    inputMove(dx: number, dy: number) {
        if (this.dashTimer > 0 || this.stunTimer > 0) return;
        this.vx = dx * this.hero.speed * this.speedMult;
        this.vy = dy * this.hero.speed * this.speedMult;
    }

    private updateAI(dt: number) {
        this.repathTimer -= dt;
        if (this.repathTimer <= 0) {
            this.repathTimer = 0.5;
            let nearestEnemy: Character | null = null; let minDist = Infinity;
            this.game.players.forEach(p => {
                if (!p.dead && p.team !== this.team) {
                    const d = MathUtils.dist(this.x, this.y, p.x, p.y);
                    if (d < minDist) { minDist = d; nearestEnemy = p; }
                }
            });
            this.target = nearestEnemy;
            this.aiState = this.target ? 'ATTACK' : 'OBJECTIVE';
        }

        let tgtX = MapConfig.zone.x + MapConfig.zone.w/2;
        let tgtY = MapConfig.zone.y + MapConfig.zone.h/2;
        if (this.target && !this.target.dead) {
            tgtX = this.target.x; tgtY = this.target.y;
            this.aimAngle = MathUtils.angle(this.x, this.y, tgtX, tgtY);
            if (MathUtils.dist(this.x, this.y, tgtX, tgtY) < 800) this.useAbility('m1');
        }
        const dx = tgtX - this.x, dy = tgtY - this.y;
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len > 10) this.inputMove(dx/len, dy/len);
    }

    useAbility(slot: string) {
        const ab = (this.hero.abilities as any)[slot];
        if (!ab || this.cooldowns[slot] > 0) return;
        if (slot === 'q' && this.ultCharge < ab.ultCost) return;
        
        if (slot === 'q') this.ultCharge = 0;
        else this.cooldowns[slot] = ab.cd;

        const spawnX = this.x + Math.cos(this.aimAngle) * this.radius;
        const spawnY = this.y + Math.sin(this.aimAngle) * this.radius;

        if (ab.type === 'shoot_straight' || ab.type === 'shoot_spread') {
            const count = ab.count || 1;
            for(let i=0; i<count; i++) {
                const ang = this.aimAngle + (ab.spread ? MathUtils.rand(-ab.spread, ab.spread) : 0);
                this.game.projectiles.push(new Projectile(spawnX, spawnY, ang, ab, this, this.game));
            }
        } else if (ab.type === 'dash') {
            this.dashTimer = ab.duration;
            this.vx = Math.cos(this.aimAngle) * ab.speed;
            this.vy = Math.sin(this.aimAngle) * ab.speed;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.aimAngle);
        ctx.fillStyle = this.hero.color;
        ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }
}

class Projectile {
    public dead: boolean = false;
    private vx: number; private vy: number;
    private life: number;

    constructor(public x: number, public y: number, angle: number, private ab: any, private owner: Character, private game: HeroArenaGame) {
        this.vx = Math.cos(angle) * ab.projSpeed;
        this.vy = Math.sin(angle) * ab.projSpeed;
        this.life = ab.projLife;
    }

    update(dt: number) {
        this.x += this.vx * dt; this.y += this.vy * dt;
        this.life -= dt;
        if (this.life <= 0) { this.dead = true; return; }
        for (let w of MapConfig.walls) {
            if (this.x > w.x && this.x < w.x+w.w && this.y > w.y && this.y < w.y+w.h) { this.dead = true; return; }
        }
        for (let p of this.game.players) {
            if (!p.dead && p.team !== this.owner.team) {
                if (MathUtils.dist(this.x, this.y, p.x, p.y) < p.radius + 5) {
                    p.takeDamage(this.ab.dmg, this.owner);
                    this.dead = true; return;
                }
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.owner.team === 'blue' ? '#00f0ff' : '#ff2a2a';
        ctx.beginPath(); ctx.arc(this.x, this.y, 3, 0, Math.PI*2); ctx.fill();
    }
}
