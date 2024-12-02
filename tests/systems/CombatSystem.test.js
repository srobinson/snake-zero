import { CombatSystem } from '../../src/systems/combat/CombatSystem.js';
import { EntityManager } from '../../src/systems/entity/EntityManager.js';
import { PhysicsSystem } from '../../src/systems/physics/PhysicsSystem.js';

describe('CombatSystem', () => {
    let combatSystem;
    let entityManager;
    let physicsSystem;

    beforeEach(() => {
        entityManager = new EntityManager();
        physicsSystem = new PhysicsSystem(entityManager);
        combatSystem = new CombatSystem(entityManager, physicsSystem);
    });

    test('should create projectiles', () => {
        const position = { x: 0, y: 0 };
        const direction = { x: 1, y: 0 };
        
        const projectileId = combatSystem.createProjectile(position, direction);
        const projectile = entityManager.getById(projectileId);
        
        expect(projectile).toBeDefined();
        expect(projectile.type).toBe('projectile');
        
        const velocity = physicsSystem.getVelocity(projectileId);
        expect(velocity.x).toBeGreaterThan(0);
    });

    test('should spawn enemies', () => {
        const position = { x: 10, y: 10 };
        
        const enemyId = combatSystem.spawnEnemy(position, 'chaser');
        const enemy = entityManager.getById(enemyId);
        
        expect(enemy).toBeDefined();
        expect(enemy.type).toBe('enemy');
        expect(enemy.enemyType).toBe('chaser');
    });

    test('should handle projectile hits', () => {
        // Create enemy
        const enemyId = combatSystem.spawnEnemy({ x: 0, y: 0 }, 'chaser', { health: 2 });
        const enemy = entityManager.getById(enemyId);
        
        // Create projectile at same position
        const projectileId = combatSystem.createProjectile(
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { damage: 1 }
        );
        
        // Update combat to check collisions
        combatSystem.update(Date.now(), { position: { x: 10, y: 10 } });
        
        // Projectile should be removed and enemy damaged
        expect(entityManager.getById(projectileId)).toBeUndefined();
        expect(enemy.health).toBe(1);
    });

    test('should remove enemies when health reaches zero', () => {
        const enemyId = combatSystem.spawnEnemy({ x: 0, y: 0 }, 'chaser', { health: 1 });
        
        const projectileId = combatSystem.createProjectile(
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { damage: 1 }
        );
        
        combatSystem.update(Date.now(), { position: { x: 10, y: 10 } });
        
        expect(entityManager.getById(enemyId)).toBeUndefined();
    });

    test('should update enemy behavior', () => {
        const enemyId = combatSystem.spawnEnemy(
            { x: 0, y: 0 },
            'chaser',
            { speed: 1 }
        );
        
        const player = {
            position: { x: 10, y: 0 }
        };
        
        combatSystem.update(Date.now(), player);
        
        const velocity = physicsSystem.getVelocity(enemyId);
        expect(velocity.x).toBeGreaterThan(0);
    });

    test('should remove expired projectiles', () => {
        const projectileId = combatSystem.createProjectile(
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { lifetime: 100 }
        );
        
        // Fast forward time
        jest.advanceTimersByTime(200);
        
        combatSystem.update(Date.now() + 200, { position: { x: 10, y: 10 } });
        
        expect(entityManager.getById(projectileId)).toBeUndefined();
    });
});
