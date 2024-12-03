/**
 * Data attribute parser for Snake game configuration
 */

const DATA_ATTRIBUTE_PREFIX = 'data-snake-';

/**
 * Valid board sizes and their corresponding presets
 */
export const VALID_BOARD_SIZES = ['small', 'medium', 'large', 'fullscreen'];

/**
 * Valid difficulty levels
 */
export const VALID_DIFFICULTIES = ['easy', 'normal', 'hard'];

/**
 * Minimum and maximum cell sizes
 */
const MIN_CELL_SIZE = 10;
const MAX_CELL_SIZE = 100;

/**
 * Maps data attributes to configuration paths
 */
const ATTRIBUTE_CONFIG_MAP: Record<string, string[]> = {
    'board-size': ['board', 'preset'],
    'cell-size': ['board', 'cellSize'],
    'difficulty': ['difficulty', 'current']
};

/**
 * Validates a board size value
 * @param value - The board size value to validate
 * @returns Whether the value is valid
 */
function isValidBoardSize(value: string): boolean {
    return VALID_BOARD_SIZES.includes(value.toLowerCase());
}

/**
 * Validates a cell size value
 * @param value - The cell size value to validate
 * @returns Whether the value is valid
 */
function isValidCellSize(value: string): boolean {
    const size = parseInt(value, 10);
    return !isNaN(size) && size >= MIN_CELL_SIZE && size <= MAX_CELL_SIZE;
}

/**
 * Validates a difficulty value
 * @param value - The difficulty value to validate
 * @returns Whether the value is valid
 */
function isValidDifficulty(value: string): boolean {
    return VALID_DIFFICULTIES.includes(value.toLowerCase());
}

/**
 * Extracts Snake game configuration from HTML data attributes
 * @param element - The element to extract configuration from
 * @returns The extracted configuration object
 */
function parseDataAttributes(element: HTMLElement | null): Record<string, any> {
    if (!element) {
        console.warn('No element provided for data attribute parsing');
        return {};
    }

    const config: Record<string, any> = {};
    const attributes = element.attributes;
    
    // Iterate through all attributes
    for (let i = 0; i < attributes.length; i++) {
        const attr = attributes[i];
        if (!attr.name.startsWith(DATA_ATTRIBUTE_PREFIX)) continue;
        
        // Extract the configuration key (remove the prefix)
        const key = attr.name.slice(DATA_ATTRIBUTE_PREFIX.length);
        const value = attr.value;
        
        // Handle board size
        if (key === 'board-size') {
            if (isValidBoardSize(value)) {
                if (!config.board) config.board = {};
                config.board.preset = value.toLowerCase();
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
                config.difficulty.current = value.toLowerCase();
            } else {
                console.warn(`Invalid difficulty: ${value}. Must be one of: ${VALID_DIFFICULTIES.join(', ')}`);
            }
        }
    }
    
    return config;
}

/**
 * Applies data attributes configuration to an existing config
 * @param baseConfig - The base configuration to extend
 * @param element - The element containing data attributes
 * @returns The merged configuration
 */
function applyDataAttributes(baseConfig: Record<string, any>, element: HTMLElement): Record<string, any> {
    const dataConfig = parseDataAttributes(element);
    if (!dataConfig) return {};
    
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

export { isValidBoardSize, isValidCellSize, isValidDifficulty, parseDataAttributes, applyDataAttributes };
