export interface Vector2 {
  x: number;
  y: number;
}

export interface Wall {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Zone {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SpawnPoint {
  x: number;
  y: number;
  color: string;
}

export interface AbilityDef {
  name: string;
  cd: number;
  type: string;
  dmg?: number;
  projSpeed?: number;
  projLife?: number;
  count?: number;
  spread?: number;
  speed?: number;
  duration?: number;
  damage?: number;
  distance?: number;
  radius?: number;
  hp?: number;
  life?: number;
  width?: number;
  ultCost?: number;
  fireRateMult?: number;
  speedMult?: number;
  stunTime?: number;
  heal?: number;
}

export interface HeroDef {
  id: string;
  name: string;
  role: 'Tank' | 'Damage' | 'Support';
  classType: 'tank' | 'damage' | 'support';
  color: string;
  desc: string;
  maxHp: number;
  speed: number;
  radius: number;
  abilities: {
    m1: AbilityDef;
    shift: AbilityDef;
    e: AbilityDef;
    q: AbilityDef;
  };
}

export type Team = 'blue' | 'red';
