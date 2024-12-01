import { gameConfig } from '../config/gameConfig.js';

export function getActiveBoardConfig() {
    const { board, boardPresets } = gameConfig;
    
    // Use preset if specified
    if (board.preset && boardPresets[board.preset]) {
        return boardPresets[board.preset];
    }
    
    // Fallback to custom settings
    const custom = board.custom;
    
    // Validate custom dimensions
    if (custom.width % custom.gridSize !== 0 || custom.height % custom.gridSize !== 0) {
        console.error('Custom board dimensions must be divisible by grid size');
        // Fallback to medium preset
        return boardPresets.medium;
    }
    
    return {
        width: custom.width,
        height: custom.height,
        gridSize: custom.gridSize,
        cols: custom.width / custom.gridSize,
        rows: custom.height / custom.gridSize
    };
}
