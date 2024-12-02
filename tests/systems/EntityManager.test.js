import { EntityManager } from '../../src/systems/entity/EntityManager.js';

describe('EntityManager', () => {
    let manager;

    beforeEach(() => {
        manager = new EntityManager();
    });

    test('should register new entities', () => {
        const entity = {
            type: 'test',
            position: { x: 0, y: 0 }
        };
        
        const id = manager.register(entity);
        expect(id).toBeDefined();
        expect(manager.getById(id)).toMatchObject(entity);
    });

    test('should remove entities', () => {
        const entity = {
            type: 'test',
            position: { x: 0, y: 0 }
        };
        
        const id = manager.register(entity);
        manager.remove(id);
        expect(manager.getById(id)).toBeUndefined();
    });

    test('should get entities by type', () => {
        const entity1 = { type: 'typeA', position: { x: 0, y: 0 } };
        const entity2 = { type: 'typeB', position: { x: 1, y: 1 } };
        const entity3 = { type: 'typeA', position: { x: 2, y: 2 } };
        
        manager.register(entity1);
        manager.register(entity2);
        manager.register(entity3);
        
        const typeAEntities = manager.getByType('typeA');
        expect(typeAEntities).toHaveLength(2);
        expect(typeAEntities.every(e => e.type === 'typeA')).toBe(true);
    });
});
