import { Entity, Vector2D } from '../types-ts/commonTypes';
import { Grid } from './Grid';
import { EventSystem } from './EventSystem';

interface EntityManagerConfig {
    gridWidth: number;
    gridHeight: number;
    cellSize: number;
}

type ComponentData = Record<string, any>;
type EntityMap = Map<string, Entity>;
type ComponentMap = Map<string, ComponentData>;

export class EntityManager {
    private entities: EntityMap;
    private components: ComponentMap;
    private grid: Grid;
    private nextEntityId: number;
    private eventSystem: EventSystem;

    constructor(config: EntityManagerConfig, eventSystem: EventSystem) {
        this.entities = new Map();
        this.components = new Map();
        this.grid = new Grid({
            width: config.gridWidth,
            height: config.gridHeight,
            cellSize: config.cellSize
        });
        this.nextEntityId = 1;
        this.eventSystem = eventSystem;
    }

    createEntity(components: ComponentData = {}): string {
        const entityId = `entity_${this.nextEntityId++}`;
        const entity: Entity = {
            id: entityId,
            active: true,
            type: components.type,
            position: components.position || { x: 0, y: 0 },
        };

        this.entities.set(entityId, entity);
        this.components.set(entityId, components);

        if (components.position) {
            this.grid.updateEntity(entityId, components.position);
        }

        this.eventSystem.emit('entityCreated', { entityId, components });
        return entityId;
    }

    removeEntity(entityId: string): void {
        const entity = this.entities.get(entityId);
        if (!entity) return;

        this.grid.removeEntity(entityId);
        this.entities.delete(entityId);
        this.components.delete(entityId);

        this.eventSystem.emit('entityRemoved', { entityId });
    }

    getEntity(entityId: string): Entity | undefined {
        return this.entities.get(entityId);
    }

    getComponent<T extends ComponentData>(entityId: string): T | undefined {
        return this.components.get(entityId) as T;
    }

    updateComponent(entityId: string, component: ComponentData): void {
        const existingComponents = this.components.get(entityId);
        if (!existingComponents) return;

        const updatedComponents = { ...existingComponents, ...component };
        this.components.set(entityId, updatedComponents);

        // Update grid if position changed
        if (component.position) {
            this.grid.updateEntity(entityId, component.position);
        }

        this.eventSystem.emit('componentUpdated', { 
            entityId, 
            component, 
            updatedComponents 
        });
    }

    updatePosition(entityId: string, position: Vector2D): void {
        const entity = this.entities.get(entityId);
        if (!entity) return;

        entity.position = position;
        this.grid.updateEntity(entityId, position);

        const components = this.components.get(entityId);
        if (components) {
            components.position = position;
        }

        this.eventSystem.emit('positionUpdated', { entityId, position });
    }

    getNearbyEntities(position: Vector2D, radius: number = 1): Entity[] {
        const entityIds = this.grid.getNearbyEntities(position, radius);
        return Array.from(entityIds)
            .map(id => this.entities.get(id))
            .filter((entity): entity is Entity => entity !== undefined);
    }

    getEntitiesWithComponent(componentName: string): Entity[] {
        return Array.from(this.components.entries())
            .filter(([_, components]) => componentName in components)
            .map(([entityId]) => this.entities.get(entityId))
            .filter((entity): entity is Entity => entity !== undefined);
    }

    setEntityActive(entityId: string, active: boolean): void {
        const entity = this.entities.get(entityId);
        if (entity) {
            entity.active = active;
            this.eventSystem.emit('entityActiveChanged', { 
                entityId, 
                active 
            });
        }
    }

    clear(): void {
        this.entities.clear();
        this.components.clear();
        this.grid.clear();
        this.nextEntityId = 1;
        this.eventSystem.emit('entitiesCleared', null);
    }

    getAllEntities(): Entity[] {
        return Array.from(this.entities.values());
    }

    getActiveEntities(): Entity[] {
        return Array.from(this.entities.values())
            .filter(entity => entity.active);
    }

    getGrid(): Grid {
        return this.grid;
    }

    toJSON(): object {
        return {
            entityCount: this.entities.size,
            activeEntityCount: this.getActiveEntities().length,
            gridState: this.grid.toJSON()
        };
    }
}
