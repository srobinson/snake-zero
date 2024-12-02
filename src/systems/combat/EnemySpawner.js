/**
 * @typedef {Object} SpawnPoint
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} GridSize
 * @property {number} width
 * @property {number} height
 */

/**
 * Manages the spawning of enemies in the game
 */
export class EnemySpawner {
    /**
     * Creates a new EnemySpawner instance
     * @param {import('../entity/EntityManager.js').EntityManager} entityManager - Entity management system
     * @param {import('./CombatSystem.js').CombatSystem} combatSystem - Combat management system
     */
    constructor(entityManager, combatSystem) {
        this.entityManager = entityManager;
        this.combatSystem = combatSystem;
        this.lastSpawnTime = Date.now();
        this.config = null;
        this.gridSize = { width: 0, height: 0 };
        this.spawnPoints = [];
    }

    /**
     * Initializes the spawner with configuration
     * @param {import('../../config/combatConfig.js').EnemyConfig} config - Enemy configuration
     * @param {GridSize} gridSize - Game grid dimensions
     */
    initialize(config, gridSize) {
        this.config = config;
        this.gridSize = gridSize;
        this.generateSpawnPoints();
    }

    generateSpawnPoints() {
        this.spawnPoints = [];
        
        // Top and bottom edges
        for (let x = 0; x < this.gridSize.width; x++) {
            this.spawnPoints.push({ x, y: 0 });
            this.spawnPoints.push({ x, y: this.gridSize.height - 1 });
        }
        
        // Left and right edges
        for (let y = 1; y < this.gridSize.height - 1; y++) {
            this.spawnPoints.push({ x: 0, y });
            this.spawnPoints.push({ x: this.gridSize.width - 1, y });
        }
    }

    getRandomSpawnPoint() {
        const index = Math.floor(Math.random() * this.spawnPoints.length);
        return { ...this.spawnPoints[index] };
    }

    getFarSpawnPoint(player, minDistance) {
        const validPoints = this.spawnPoints.filter(point => {
            const dx = point.x - player.position.x;
            const dy = point.y - player.position.y;
            return (dx * dx + dy * dy) >= minDistance * minDistance;
        });

        if (validPoints.length === 0) return this.getRandomSpawnPoint();
        
        const index = Math.floor(Math.random() * validPoints.length);
        return { ...validPoints[index] };
    }

    update(currentTime, player, difficulty) {
        if (!this.config) return;

        const difficultySettings = this.config.difficulty[difficulty];
        if (!difficultySettings) return;

        // Calculate spawn timing
        const spawnInterval = (60 * 1000) / (this.config.spawnRate * difficultySettings.spawnRateMultiplier);
        if (currentTime - this.lastSpawnTime < spawnInterval) return;

        // Check max enemies
        const currentEnemies = this.entityManager.getByType('enemy');
        const maxEnemies = Math.floor(this.config.maxEnemies * difficultySettings.maxEnemiesMultiplier);
        if (currentEnemies.length >= maxEnemies) return;

        // Get spawn position
        const spawnPoint = this.getFarSpawnPoint(player, 5);
        if (!spawnPoint) return;

        // Determine enemy type to spawn
        const enemyType = this.selectEnemyType(player);
        
        // Apply difficulty multipliers
        const enemyConfig = this.config.types[enemyType];
        const spawnConfig = {
            health: enemyConfig.health * difficultySettings.healthMultiplier,
            speed: enemyConfig.speed * difficultySettings.speedMultiplier,
            damage: enemyConfig.damage * difficultySettings.damageMultiplier
        };

        // Spawn enemy
        this.combatSystem.spawnEnemy(spawnPoint, enemyType, spawnConfig);
        this.lastSpawnTime = currentTime;
    }

    selectEnemyType(player) {
        const types = Object.keys(this.config.types);
        const currentEnemies = this.entityManager.getByType('enemy');
        
        // If no enemies, prefer easier types
        if (currentEnemies.length === 0) {
            return Math.random() < 0.7 ? 'patrol' : 'chaser';
        }

        // Count current enemy types
        const typeCounts = currentEnemies.reduce((counts, enemy) => {
            counts[enemy.enemyType] = (counts[enemy.enemyType] || 0) + 1;
            return counts;
        }, {});

        // Prefer types that are underrepresented
        const typeWeights = types.map(type => ({
            type,
            weight: 1 / (typeCounts[type] || 0.1)
        }));

        const totalWeight = typeWeights.reduce((sum, tw) => sum + tw.weight, 0);
        let random = Math.random() * totalWeight;

        for (const tw of typeWeights) {
            random -= tw.weight;
            if (random <= 0) return tw.type;
        }

        return types[0];
    }
}
