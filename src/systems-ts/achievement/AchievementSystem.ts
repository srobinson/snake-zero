import { EventSystem } from '../../core-ts/EventSystem';

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon?: string;
    secret?: boolean;
    condition: () => boolean;
    reward?: {
        type: string;
        value: any;
    };
}

interface AchievementProgress {
    achieved: boolean;
    timestamp?: number;
    progress?: number;
}

interface AchievementConfig {
    storageKey?: string;
    notificationDuration?: number;
    achievements: Achievement[];
}

export class AchievementSystem {
    private eventSystem: EventSystem;
    private achievements: Map<string, Achievement>;
    private progress: Map<string, AchievementProgress>;
    private storageKey: string;
    private notificationDuration: number;
    private stats: {
        score: number;
        length: number;
        foodEaten: number;
        powerUpsCollected: number;
        enemiesDefeated: number;
        timeAlive: number;
    };

    constructor(eventSystem: EventSystem, config: AchievementConfig) {
        this.eventSystem = eventSystem;
        this.achievements = new Map();
        this.progress = new Map();
        this.storageKey = config.storageKey || 'snakeAchievements';
        this.notificationDuration = config.notificationDuration || 3000;
        this.stats = {
            score: 0,
            length: 0,
            foodEaten: 0,
            powerUpsCollected: 0,
            enemiesDefeated: 0,
            timeAlive: 0
        };

        // Register achievements
        config.achievements.forEach(achievement => {
            this.registerAchievement(achievement);
        });

        // Load progress
        this.loadProgress();

        // Set up event listeners
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.eventSystem.on('scoreUpdated', this.handleScoreUpdate.bind(this));
        this.eventSystem.on('snakeLengthChanged', this.handleLengthUpdate.bind(this));
        this.eventSystem.on('foodEaten', () => this.stats.foodEaten++);
        this.eventSystem.on('powerUpCollected', () => this.stats.powerUpsCollected++);
        this.eventSystem.on('enemyDefeated', () => this.stats.enemiesDefeated++);
        this.eventSystem.on('gameOver', () => this.saveProgress());
    }

    private handleScoreUpdate(data: { totalScore: number }): void {
        this.stats.score = data.totalScore;
        this.checkAchievements();
    }

    private handleLengthUpdate(data: { length: number }): void {
        this.stats.length = data.length;
        this.checkAchievements();
    }

    registerAchievement(achievement: Achievement): void {
        this.achievements.set(achievement.id, achievement);
        if (!this.progress.has(achievement.id)) {
            this.progress.set(achievement.id, { achieved: false });
        }
    }

    private loadProgress(): void {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.progress = new Map(Object.entries(parsed));
            }
        } catch (error) {
            console.error('Error loading achievements:', error);
        }
    }

    private saveProgress(): void {
        try {
            const data = Object.fromEntries(this.progress);
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving achievements:', error);
        }
    }

    private checkAchievements(): void {
        this.achievements.forEach((achievement, id) => {
            const progress = this.progress.get(id);
            if (progress && !progress.achieved && achievement.condition()) {
                this.unlockAchievement(id);
            }
        });
    }

    private unlockAchievement(id: string): void {
        const achievement = this.achievements.get(id);
        if (!achievement) return;

        const progress: AchievementProgress = {
            achieved: true,
            timestamp: Date.now()
        };

        this.progress.set(id, progress);
        this.saveProgress();

        // Handle reward if present
        if (achievement.reward) {
            this.eventSystem.emit('achievementReward', {
                achievementId: id,
                reward: achievement.reward
            });
        }

        // Emit achievement unlocked event
        this.eventSystem.emit('achievementUnlocked', {
            id,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            secret: achievement.secret
        });

        // Show notification
        this.showNotification(achievement);
    }

    private showNotification(achievement: Achievement): void {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            ${achievement.icon ? `<img src="${achievement.icon}" alt="Achievement">` : ''}
            <div class="achievement-info">
                <h3>${achievement.name}</h3>
                <p>${achievement.description}</p>
            </div>
        `;

        // Add to document
        document.body.appendChild(notification);

        // Trigger animation
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });

        // Remove after duration
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, this.notificationDuration);
    }

    isAchieved(id: string): boolean {
        return this.progress.get(id)?.achieved || false;
    }

    getProgress(id: string): AchievementProgress | undefined {
        return this.progress.get(id);
    }

    getAllAchievements(): Achievement[] {
        return Array.from(this.achievements.values());
    }

    getUnlockedAchievements(): Achievement[] {
        return Array.from(this.achievements.values())
            .filter(achievement => this.isAchieved(achievement.id));
    }

    getStats(): typeof this.stats {
        return { ...this.stats };
    }

    reset(): void {
        this.progress.clear();
        this.saveProgress();
        this.stats = {
            score: 0,
            length: 0,
            foodEaten: 0,
            powerUpsCollected: 0,
            enemiesDefeated: 0,
            timeAlive: 0
        };
    }

    toJSON(): object {
        return {
            unlockedCount: this.getUnlockedAchievements().length,
            totalCount: this.achievements.size,
            stats: this.stats
        };
    }
}
