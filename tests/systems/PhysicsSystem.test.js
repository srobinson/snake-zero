import { PhysicsSystem } from '../../src/systems/physics/PhysicsSystem.js';
import { EntityManager } from '../../src/systems/entity/EntityManager.js';

describe('PhysicsSystem', () => {
    let physicsSystem;
    let entityManager;

    beforeEach(() => {
        entityManager = new EntityManager();
        physicsSystem = new PhysicsSystem(entityManager);
        physicsSystem.setBoundaries(100, 100);
    });

    test('should update entity position based on velocity', () => {
        const entity = {
            type: 'test',
            position: { x: 50, y: 50 }
        };
        
        const id = entityManager.register(entity);
        physicsSystem.setVelocity(id, { x: 10, y: 0 });
        
        physicsSystem.update(1000); // 1 second
        
        const updatedEntity = entityManager.getById(id);
        expect(updatedEntity.position.x).toBe(60);
        expect(updatedEntity.position.y).toBe(50);
    });

    test('should handle wrap-around boundaries', () => {
        const entity = {
            type: 'test',
            position: { x: 95, y: 50 },
            boundaryBehavior: 'wrap'
        };
        
        const id = entityManager.register(entity);
        physicsSystem.setVelocity(id, { x: 10, y: 0 });
        
        physicsSystem.update(1000);
        
        const updatedEntity = entityManager.getById(id);
        expect(updatedEntity.position.x).toBe(5);
        expect(updatedEntity.position.y).toBe(50);
    });

    test('should handle bounce boundaries', () => {
        const entity = {
            type: 'test',
            position: { x: 95, y: 50 },
            boundaryBehavior: 'bounce'
        };
        
        const id = entityManager.register(entity);
        physicsSystem.setVelocity(id, { x: 10, y: 0 });
        
        physicsSystem.update(1000);
        
        const updatedEntity = entityManager.getById(id);
        const velocity = physicsSystem.getVelocity(id);
        
        expect(updatedEntity.position.x).toBeLessThan(100);
        expect(velocity.x).toBe(-10);
    });

    test('should calculate distance correctly', () => {
        const distance = PhysicsSystem.distance(
            { x: 0, y: 0 },
            { x: 3, y: 4 }
        );
        expect(distance).toBe(5);
    });

    test('should normalize vectors correctly', () => {
        const normalized = PhysicsSystem.normalize({ x: 3, y: 4 });
        expect(normalized.x).toBeCloseTo(0.6);
        expect(normalized.y).toBeCloseTo(0.8);
    });
});
