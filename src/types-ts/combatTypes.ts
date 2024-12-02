import { Vector2D } from './commonTypes';

export interface ChaserBehavior {
    type: 'chaser';
    detectionRange: number;
    chaseSpeed: number;
    wanderSpeed: number;
}

export interface PatrolBehavior {
    type: 'patrol';
    patrolDistance: number;
    patrolSpeed: number;
    patrolState: {
        direction: number;
        startPos: Vector2D;
    };
}

export interface ShooterBehavior {
    type: 'shooter';
    shootRange: number;
    shootCooldown: number;
    projectileSpeed: number;
    projectileDamage: number;
}

export type EnemyBehavior = ChaserBehavior | PatrolBehavior | ShooterBehavior;

export interface ProjectileConfig {
    damage?: number;
    speed?: number;
    lifetime?: number;
    size?: number;
}

export interface ProjectileEntity {
    id: string;
    type: 'projectile';
    position: Vector2D;
    damage: number;
    speed: number;
    lifetime: number;
    createdAt: number;
    ownerId?: string;
}
