export interface Position {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface Effect {
    type: string;
    startTime: number;
    duration: number;
    boost?: number;
    multiplier?: number;
}

export interface Obstacle {
    position: Position;
}
