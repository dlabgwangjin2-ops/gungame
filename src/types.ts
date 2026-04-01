export type Difficulty = 'easy' | 'normal' | 'hard';

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export type WeaponType = 'pistol' | 'smg' | 'grenade' | 'minigun';

export interface Bullet extends Entity {
  speed: number;
  type: WeaponType;
  damage: number;
  radius?: number; // For grenade explosion
}

export interface Enemy extends Entity {
  speed: number;
  hp: number;
  maxHp: number;
  type: 'basic' | 'fast' | 'tank';
}

export interface Particle extends Entity {
  vx: number;
  vy: number;
  life: number;
  opacity: number;
}

export interface GameState {
  score: number;
  highScore: number;
  isGameOver: boolean;
  isPaused: boolean;
  level: number;
}
