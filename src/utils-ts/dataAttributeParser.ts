import type { GameConfig } from '../config-ts/types';

const DATA_ATTRIBUTE_PREFIX = 'data-snake-';

export const VALID_BOARD_SIZES = ['small', 'medium', 'large', 'fullscreen'] as const;
export const VALID_DIFFICULTIES = ['easy', 'normal', 'hard'] as const;

const MIN_CELL_SIZE = 10;
const MAX_CELL_SIZE = 100;

const ATTRIBUTE_CONFIG_MAP = {
    'board-size': ['board', 'preset'],
    'cell-size': ['board', 'cellSize'],
    'difficulty': ['difficulty', 'current']
} as const;

function isValidBoardSize(value: string): boolean {
    return VALID_BOARD_SIZES.includes(value.toLowerCase() as typeof VALID_BOARD_SIZES[number]);
}

function isValidCellSize(value: string): boolean {
    const size = parseInt(value, 10);
    return !isNaN(size) && size >= MIN_CELL_SIZE && size <= MAX_CELL_SIZE;
}

function isValidDifficulty(value: string): boolean {
    return VALID_DIFFICULTIES.includes(value.toLowerCase() as typeof VALID_DIFFICULTIES[number]);
}

export function parseDataAttributes(element: HTMLElement): Partial<GameConfig> | null {
    const config: Partial<GameConfig> = {};
    
    // Get all data attributes
    const attributes = Array.from(element.attributes);
    
    for (const attr of attributes) {
        if (!attr.name.startsWith(DATA_ATTRIBUTE_PREFIX)) continue;
        
        // Extract key and value
        const key = attr.name.slice(DATA_ATTRIBUTE_PREFIX.length);
        const value = attr.value;
        
        // Handle board size
        if (key === 'board-size') {
            if (isValidBoardSize(value)) {
                if (!config.board) config.board = {};
                config.board.preset = value.toLowerCase() as typeof VALID_BOARD_SIZES[number];
            } else {
                console.warn(`Invalid board size: ${value}. Must be one of: ${VALID_BOARD_SIZES.join(', ')}`);
            }
        }
        // Handle cell size
        else if (key === 'cell-size') {
            if (isValidCellSize(value)) {
                if (!config.board) config.board = {};
                config.board.cellSize = parseInt(value, 10);
            } else {
                console.warn(`Invalid cell size: ${value}. Must be between ${MIN_CELL_SIZE} and ${MAX_CELL_SIZE}`);
            }
        }
        // Handle difficulty
        else if (key === 'difficulty') {
            if (isValidDifficulty(value)) {
                if (!config.difficulty) config.difficulty = {};
                config.difficulty.current = value.toLowerCase() as typeof VALID_DIFFICULTIES[number];
            } else {
                console.warn(`Invalid difficulty: ${value}. Must be one of: ${VALID_DIFFICULTIES.join(', ')}`);
            }
        }
    }
    
    return Object.keys(config).length > 0 ? config : null;
}

export function applyDataAttributes(baseConfig: GameConfig, element: HTMLElement): GameConfig | null {
    const dataConfig = parseDataAttributes(element);
    if (!dataConfig) return null;
    
    const newConfig = { ...baseConfig };
    
    // Handle board configuration
    if (dataConfig.board) {
        // Handle board preset
        if (dataConfig.board.preset) {
            newConfig.board.preset = dataConfig.board.preset;
        }
        
        // Handle cell size - apply to current preset
        if (dataConfig.board.cellSize) {
            const preset = newConfig.board.preset;
            if (!newConfig.board.presets[preset]) {
                newConfig.board.presets[preset] = { ...baseConfig.board.presets[preset] };
            }
            newConfig.board.presets[preset].cellSize = dataConfig.board.cellSize;
        }
    }
    
    // Handle difficulty configuration
    if (dataConfig.difficulty) {
        if (dataConfig.difficulty.current) {
            newConfig.difficulty.current = dataConfig.difficulty.current;
        }
    }
    
    return newConfig;
}
