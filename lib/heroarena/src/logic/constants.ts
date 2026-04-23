import { HeroDef, Wall, Zone, SpawnPoint } from '../types';

export const MathUtils = {
    dist: (x1: number, y1: number, x2: number, y2: number) => Math.sqrt((x2-x1)**2 + (y2-y1)**2),
    angle: (x1: number, y1: number, x2: number, y2: number) => Math.atan2(y2-y1, x2-x1),
    clamp: (val: number, min: number, max: number) => Math.max(min, Math.min(max, val)),
    rand: (min: number, max: number) => Math.random() * (max - min) + min,
    circleRectCollide: (cx: number, cy: number, radius: number, rx: number, ry: number, rw: number, rh: number) => {
        let testX = cx;
        let testY = cy;
        if (cx < rx) testX = rx; else if (cx > rx + rw) testX = rx + rw;
        if (cy < ry) testY = ry; else if (cy > ry + rh) testY = ry + rh;
        return MathUtils.dist(cx, cy, testX, testY) <= radius;
    }
};

export const MapConfig: {
  width: number;
  height: number;
  walls: Wall[];
  zone: Zone;
  spawns: {
    blue: SpawnPoint;
    red: SpawnPoint;
  };
} = {
    width: 2400,
    height: 1600,
    walls: [
        // Borders
        {x: 0, y: 0, w: 2400, h: 50},
        {x: 0, y: 1550, w: 2400, h: 50},
        {x: 0, y: 0, w: 50, h: 1600},
        {x: 2350, y: 0, w: 50, h: 1600},
        // Central Zone Cover
        {x: 1000, y: 600, w: 50, h: 400},
        {x: 1350, y: 600, w: 50, h: 400},
        // Spawn Covers
        {x: 400, y: 400, w: 50, h: 300},
        {x: 400, y: 900, w: 50, h: 300},
        {x: 1950, y: 400, w: 50, h: 300},
        {x: 1950, y: 900, w: 50, h: 300},
        // Random obstacles
        {x: 800, y: 200, w: 200, h: 100},
        {x: 1400, y: 1300, w: 200, h: 100},
        {x: 1150, y: 300, w: 100, h: 100},
        {x: 1150, y: 1200, w: 100, h: 100}
    ],
    zone: { x: 1050, y: 650, w: 300, h: 300 }, // Center capture area
    spawns: {
        blue: { x: 200, y: 800, color: 'rgba(0, 240, 255, 0.2)' },
        red: { x: 2200, y: 800, color: 'rgba(255, 42, 42, 0.2)' }
    }
};

export const HeroClasses: Record<string, HeroDef> = {
    TITAN: {
        id: 'titan', name: 'TITAN', role: 'Tank', classType: 'tank', color: '#ffaa00',
        desc: 'Heavily armored frontliner. Uses a scatter gun and deploys barriers.',
        maxHp: 500, speed: 200, radius: 24,
        abilities: {
            m1: { name: 'Scatter Gun', cd: 0.8, type: 'shoot_spread', dmg: 12, projSpeed: 800, projLife: 0.3, count: 5, spread: 0.3 },
            shift: { name: 'Charge', cd: 6, type: 'dash', speed: 800, duration: 0.4, damage: 50 },
            e: { name: 'Aegis Barrier', cd: 10, type: 'deploy_shield', hp: 800, life: 5, width: 120 },
            q: { name: 'Earthshatter', cd: 30, type: 'aoe_stun', radius: 300, dmg: 75, stunTime: 1.5, ultCost: 1500 }
        }
    },
    WRAITH: {
        id: 'wraith', name: 'WRAITH', role: 'Damage', classType: 'damage', color: '#ff2a2a',
        desc: 'Highly mobile assassin. Shoots rapid plasma bolts and uses explosive tech.',
        maxHp: 200, speed: 260, radius: 18,
        abilities: {
            m1: { name: 'Plasma Rifle', cd: 0.15, type: 'shoot_straight', dmg: 18, projSpeed: 1200, projLife: 1.0 },
            shift: { name: 'Blink', cd: 5, type: 'teleport', distance: 250 },
            e: { name: 'Frag Grenade', cd: 8, type: 'projectile_explosive', dmg: 60, radius: 150, projSpeed: 600, projLife: 1.0 },
            q: { name: 'Overclock', cd: 30, type: 'buff_self', duration: 6, fireRateMult: 0.4, speedMult: 1.5, ultCost: 1200 }
        }
    },
    AURA: {
        id: 'aura', name: 'AURA', role: 'Support', classType: 'support', color: '#39ff14',
        desc: 'Combat medic. Heals allies with energy waves and boosts team speed.',
        maxHp: 200, speed: 240, radius: 18,
        abilities: {
            m1: { name: 'Energy Dart', cd: 0.3, type: 'shoot_straight', dmg: 25, projSpeed: 1000, projLife: 0.8 },
            shift: { name: 'Healing Wave', cd: 2, type: 'shoot_heal', heal: 40, projSpeed: 600, projLife: 1.0 },
            e: { name: 'Speed Aura', cd: 12, type: 'aura_buff', radius: 300, duration: 4, speedMult: 1.6 },
            q: { name: 'Resurgence', cd: 30, type: 'aoe_heal', radius: 400, heal: 300, ultCost: 1000 }
        }
    }
};
