import { GameSystems } from '../../src/systems/GameSystems.js';

describe('GameSystems', () => {
    let gameSystems;
    let mockConfig;
    let mockEvents;

    beforeEach(() => {
        mockEvents = {
            emit: jest.fn()
        };

        mockConfig = {
            events: mockEvents,
            snake: {
                baseSpeed: 1
            },
            combat: {
                projectileDamage: 1,
                projectileSpeed: 5
            }
        };

        gameSystems = new GameSystems(mockConfig);
        gameSystems.initialize({ width: 100, height: 100 });
    });

    afterEach(() => {
        gameSystems.cleanup();
    });

    test('should initialize all systems', () => {
        expect(gameSystems.entityManager).toBeDefined();
        expect(gameSystems.physicsSystem).toBeDefined();
        expect(gameSystems.inputSystem).toBeDefined();
        expect(gameSystems.collisionSystem).toBeDefined();
        expect(gameSystems.combatSystem).toBeDefined();
    });

    test('should handle movement input', () => {
        // Create a mock snake
        const snakeId = gameSystems.entityManager.register({
            type: 'snake',
            position: { x: 50, y: 50 }
        });

        // Simulate movement input
        const event = new KeyboardEvent('keydown', { code: 'ArrowRight' });
        window.dispatchEvent(event);

        // Check if velocity was set
        const velocity = gameSystems.physicsSystem.getVelocity(snakeId);
        expect(velocity).toBeDefined();
        expect(velocity.x).toBeGreaterThan(0);
    });

    test('should handle shooting', () => {
        // Create a mock snake
        const snakeId = gameSystems.entityManager.register({
            type: 'snake',
            position: { x: 50, y: 50 }
        });

        // Set initial velocity for direction
        gameSystems.physicsSystem.setVelocity(snakeId, { x: 1, y: 0 });

        // Simulate shooting
        const event = new KeyboardEvent('keydown', { code: 'Space' });
        window.dispatchEvent(event);

        // Check if projectile was created
        const projectiles = gameSystems.entityManager.getByType('projectile');
        expect(projectiles.length).toBe(1);
        expect(projectiles[0].ownerId).toBe(snakeId);
    });

    test('should handle collisions', () => {
        // Create snake and food
        const snake = gameSystems.entityManager.register({
            type: 'snake',
            position: { x: 50, y: 50 }
        });

        const food = gameSystems.entityManager.register({
            type: 'food',
            position: { x: 50, y: 50 },
            points: 10
        });

        // Update systems to trigger collision
        gameSystems.update(Date.now());

        // Check if food was collected
        expect(mockEvents.emit).toHaveBeenCalledWith('FOOD_COLLECTED', expect.any(Object));
        expect(gameSystems.entityManager.getById(food)).toBeUndefined();
    });

    test('should pause and resume', () => {
        const initialTime = Date.now();
        gameSystems.update(initialTime);
        
        gameSystems.pause();
        expect(gameSystems.isPaused).toBe(true);
        
        // Updates should not affect state while paused
        const snakeId = gameSystems.entityManager.register({
            type: 'snake',
            position: { x: 50, y: 50 }
        });
        gameSystems.physicsSystem.setVelocity(snakeId, { x: 1, y: 0 });
        
        gameSystems.update(initialTime + 1000);
        const pausedPosition = gameSystems.entityManager.getById(snakeId).position;
        expect(pausedPosition.x).toBe(50);
        
        gameSystems.resume();
        expect(gameSystems.isPaused).toBe(false);
    });
});
