import { EventSystem } from '../../core-ts/EventSystem';

interface Sound {
    buffer: AudioBuffer;
    volume: number;
    loop: boolean;
}

interface SoundConfig {
    sounds: {
        [key: string]: string; // URL paths to sound files
    };
    volumes: {
        [key: string]: number;
    };
    loops: {
        [key: string]: boolean;
    };
    defaultVolume: number;
}

export class SoundSystem {
    private context: AudioContext;
    private eventSystem: EventSystem;
    private sounds: Map<string, Sound>;
    private activeSources: Map<string, AudioBufferSourceNode[]>;
    private config: SoundConfig;
    private masterVolume: GainNode;
    private muted: boolean;
    private loadPromise: Promise<void>;

    constructor(eventSystem: EventSystem, config: SoundConfig) {
        this.context = new AudioContext();
        this.eventSystem = eventSystem;
        this.config = config;
        this.sounds = new Map();
        this.activeSources = new Map();
        this.masterVolume = this.context.createGain();
        this.masterVolume.connect(this.context.destination);
        this.muted = false;

        // Load all sounds
        this.loadPromise = this.loadSounds();

        // Set up event listeners
        this.setupEventListeners();
    }

    private async loadSounds(): Promise<void> {
        const loadPromises = Object.entries(this.config.sounds).map(async ([name, url]) => {
            try {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

                this.sounds.set(name, {
                    buffer: audioBuffer,
                    volume: this.config.volumes[name] ?? this.config.defaultVolume,
                    loop: this.config.loops[name] ?? false
                });
            } catch (error) {
                console.error(`Failed to load sound: ${name}`, error);
            }
        });

        await Promise.all(loadPromises);
    }

    private setupEventListeners(): void {
        // Game events
        this.eventSystem.on('foodEaten', this.handleFoodEaten.bind(this));
        this.eventSystem.on('specialFoodSpawned', () => this.play('specialFood'));
        this.eventSystem.on('powerUpStarted', () => this.play('powerUp'));
        this.eventSystem.on('powerUpEnded', () => this.play('powerDown'));
        this.eventSystem.on('snakeDied', () => this.play('death'));
        this.eventSystem.on('collision', this.handleCollision.bind(this));
    }

    private handleFoodEaten(data: { isSpecial: boolean }): void {
        this.play(data.isSpecial ? 'specialFoodEaten' : 'foodEaten');
    }

    private handleCollision(data: { type1: string; type2: string }): void {
        const types = [data.type1, data.type2];
        if (types.includes('snake_head') && types.includes('wall')) {
            this.play('wallHit');
        }
    }

    async play(soundName: string, options: { volume?: number; loop?: boolean } = {}): Promise<void> {
        if (this.muted) return;

        // Ensure sounds are loaded
        await this.loadPromise;

        const sound = this.sounds.get(soundName);
        if (!sound) {
            console.warn(`Sound not found: ${soundName}`);
            return;
        }

        // Create nodes
        const source = this.context.createBufferSource();
        const gainNode = this.context.createGain();

        // Set up source
        source.buffer = sound.buffer;
        source.loop = options.loop ?? sound.loop;

        // Set up volume
        const volume = options.volume ?? sound.volume;
        gainNode.gain.value = volume;

        // Connect nodes
        source.connect(gainNode);
        gainNode.connect(this.masterVolume);

        // Store active source
        if (!this.activeSources.has(soundName)) {
            this.activeSources.set(soundName, []);
        }
        this.activeSources.get(soundName)!.push(source);

        // Clean up when playback ends
        source.onended = () => {
            const sources = this.activeSources.get(soundName);
            if (sources) {
                const index = sources.indexOf(source);
                if (index !== -1) {
                    sources.splice(index, 1);
                }
                if (sources.length === 0) {
                    this.activeSources.delete(soundName);
                }
            }
        };

        // Start playback
        source.start(0);
    }

    stop(soundName: string): void {
        const sources = this.activeSources.get(soundName);
        if (sources) {
            sources.forEach(source => {
                try {
                    source.stop();
                } catch (error) {
                    console.warn(`Error stopping sound: ${soundName}`, error);
                }
            });
            this.activeSources.delete(soundName);
        }
    }

    stopAll(): void {
        for (const [soundName] of this.activeSources) {
            this.stop(soundName);
        }
    }

    setMasterVolume(volume: number): void {
        this.masterVolume.gain.value = Math.max(0, Math.min(1, volume));
    }

    setMuted(muted: boolean): void {
        this.muted = muted;
        if (muted) {
            this.stopAll();
        }
    }

    async isReady(): Promise<boolean> {
        try {
            await this.loadPromise;
            return true;
        } catch {
            return false;
        }
    }

    resume(): Promise<void> {
        return this.context.resume();
    }

    suspend(): Promise<void> {
        return this.context.suspend();
    }

    toJSON(): object {
        return {
            muted: this.muted,
            masterVolume: this.masterVolume.gain.value,
            loadedSounds: Array.from(this.sounds.keys()),
            activeSounds: Array.from(this.activeSources.keys())
        };
    }
}
