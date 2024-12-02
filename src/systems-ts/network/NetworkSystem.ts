import { EventSystem } from '../../core-ts/EventSystem';

interface NetworkConfig {
    serverUrl: string;
    reconnectDelay?: number;
    maxReconnectAttempts?: number;
    pingInterval?: number;
}

interface NetworkMessage {
    type: string;
    data: any;
    timestamp: number;
}

interface NetworkStats {
    ping: number;
    messagesSent: number;
    messagesReceived: number;
    bytesTransferred: number;
    lastMessageTime: number;
}

export class NetworkSystem {
    private eventSystem: EventSystem;
    private config: Required<NetworkConfig>;
    private socket: WebSocket | null;
    private connected: boolean;
    private reconnectAttempts: number;
    private reconnectTimeout: number | null;
    private pingInterval: number | null;
    private messageQueue: NetworkMessage[];
    private stats: NetworkStats;
    private handlers: Map<string, (data: any) => void>;

    constructor(eventSystem: EventSystem, config: NetworkConfig) {
        this.eventSystem = eventSystem;
        this.config = {
            reconnectDelay: 5000,
            maxReconnectAttempts: 5,
            pingInterval: 30000,
            ...config
        };
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.reconnectTimeout = null;
        this.pingInterval = null;
        this.messageQueue = [];
        this.stats = {
            ping: 0,
            messagesSent: 0,
            messagesReceived: 0,
            bytesTransferred: 0,
            lastMessageTime: 0
        };
        this.handlers = new Map();

        // Register default message handlers
        this.setupMessageHandlers();

        // Connect to server
        this.connect();
    }

    private setupMessageHandlers(): void {
        // Handle player updates
        this.registerHandler('playerUpdate', data => {
            this.eventSystem.emit('remotePlayerUpdate', data);
        });

        // Handle game state updates
        this.registerHandler('gameState', data => {
            this.eventSystem.emit('gameStateUpdate', data);
        });

        // Handle ping responses
        this.registerHandler('pong', data => {
            const now = performance.now();
            this.stats.ping = now - data.timestamp;
        });
    }

    private connect(): void {
        if (this.socket || this.reconnectTimeout !== null) return;

        try {
            this.socket = new WebSocket(this.config.serverUrl);
            this.setupSocketListeners();
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.handleDisconnect();
        }
    }

    private setupSocketListeners(): void {
        if (!this.socket) return;

        this.socket.onopen = () => {
            this.connected = true;
            this.reconnectAttempts = 0;
            this.flushMessageQueue();
            this.startPingInterval();
            this.eventSystem.emit('networkConnected', null);
        };

        this.socket.onclose = () => {
            this.handleDisconnect();
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.eventSystem.emit('networkError', { error });
        };

        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
                this.stats.messagesReceived++;
                this.stats.bytesTransferred += event.data.length;
                this.stats.lastMessageTime = performance.now();
            } catch (error) {
                console.error('Error handling message:', error);
            }
        };
    }

    private handleDisconnect(): void {
        this.connected = false;
        this.socket = null;
        this.stopPingInterval();
        this.eventSystem.emit('networkDisconnected', null);

        // Attempt to reconnect
        if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.reconnectTimeout = window.setTimeout(() => {
                this.reconnectTimeout = null;
                this.connect();
            }, this.config.reconnectDelay);
        } else {
            this.eventSystem.emit('networkFailed', {
                attempts: this.reconnectAttempts
            });
        }
    }

    private startPingInterval(): void {
        this.pingInterval = window.setInterval(() => {
            this.send('ping', { timestamp: performance.now() });
        }, this.config.pingInterval);
    }

    private stopPingInterval(): void {
        if (this.pingInterval !== null) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    private handleMessage(message: NetworkMessage): void {
        const handler = this.handlers.get(message.type);
        if (handler) {
            try {
                handler(message.data);
            } catch (error) {
                console.error(`Error in message handler for ${message.type}:`, error);
            }
        }
    }

    private flushMessageQueue(): void {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            if (message) {
                this.sendImmediate(message);
            }
        }
    }

    registerHandler(type: string, handler: (data: any) => void): void {
        this.handlers.set(type, handler);
    }

    unregisterHandler(type: string): void {
        this.handlers.delete(type);
    }

    send(type: string, data: any): void {
        const message: NetworkMessage = {
            type,
            data,
            timestamp: performance.now()
        };

        if (this.connected && this.socket?.readyState === WebSocket.OPEN) {
            this.sendImmediate(message);
        } else {
            this.messageQueue.push(message);
        }
    }

    private sendImmediate(message: NetworkMessage): void {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

        try {
            const serialized = JSON.stringify(message);
            this.socket.send(serialized);
            this.stats.messagesSent++;
            this.stats.bytesTransferred += serialized.length;
        } catch (error) {
            console.error('Error sending message:', error);
            this.messageQueue.push(message);
        }
    }

    isConnected(): boolean {
        return this.connected;
    }

    getPing(): number {
        return this.stats.ping;
    }

    getStats(): NetworkStats {
        return { ...this.stats };
    }

    disconnect(): void {
        if (this.reconnectTimeout !== null) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        this.stopPingInterval();
        
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        
        this.connected = false;
        this.messageQueue = [];
    }

    toJSON(): object {
        return {
            connected: this.connected,
            reconnectAttempts: this.reconnectAttempts,
            queuedMessages: this.messageQueue.length,
            stats: this.stats
        };
    }
}
