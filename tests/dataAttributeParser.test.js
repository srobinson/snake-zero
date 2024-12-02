/**
 * Tests for data attribute parsing functionality
 */

import { parseDataAttributes, VALID_BOARD_SIZES, VALID_DIFFICULTIES } from '../src/utils/dataAttributeParser.js';

describe('Data Attribute Parser', () => {
    let container;
    
    beforeEach(() => {
        container = document.createElement('div');
    });
    
    test('should handle missing element gracefully', () => {
        const config = parseDataAttributes(null);
        expect(config).toBeNull();
    });
    
    // Board Size Tests
    describe('Board Size Parsing', () => {
        test('should parse valid board size', () => {
            container.setAttribute('data-snake-board-size', 'medium');
            const config = parseDataAttributes(container);
            expect(config.board.preset).toBe('medium');
        });
        
        test('should ignore invalid board size', () => {
            container.setAttribute('data-snake-board-size', 'invalid');
            const config = parseDataAttributes(container);
            expect(config.board?.preset).toBeUndefined();
        });
        
        test('should convert board size to lowercase', () => {
            container.setAttribute('data-snake-board-size', 'LARGE');
            const config = parseDataAttributes(container);
            expect(config.board.preset).toBe('large');
        });
        
        test('should handle all valid board sizes', () => {
            VALID_BOARD_SIZES.forEach(size => {
                container.setAttribute('data-snake-board-size', size);
                const config = parseDataAttributes(container);
                expect(config.board.preset).toBe(size);
            });
        });
    });
    
    // Cell Size Tests
    describe('Cell Size Parsing', () => {
        test('should parse valid cell size', () => {
            container.setAttribute('data-snake-cell-size', '20');
            const config = parseDataAttributes(container);
            expect(config.board.cellSize).toBe(20);
        });
        
        test('should ignore cell size below minimum', () => {
            container.setAttribute('data-snake-cell-size', '5');
            const config = parseDataAttributes(container);
            expect(config.board?.cellSize).toBeUndefined();
        });
        
        test('should ignore cell size above maximum', () => {
            container.setAttribute('data-snake-cell-size', '150');
            const config = parseDataAttributes(container);
            expect(config.board?.cellSize).toBeUndefined();
        });
        
        test('should ignore non-numeric cell size', () => {
            container.setAttribute('data-snake-cell-size', 'large');
            const config = parseDataAttributes(container);
            expect(config.board?.cellSize).toBeUndefined();
        });
        
        test('should parse cell size at boundaries', () => {
            container.setAttribute('data-snake-cell-size', '10');
            let config = parseDataAttributes(container);
            expect(config.board.cellSize).toBe(10);
            
            container.setAttribute('data-snake-cell-size', '100');
            config = parseDataAttributes(container);
            expect(config.board.cellSize).toBe(100);
        });
    });
    
    test('should ignore non-snake data attributes', () => {
        container.setAttribute('data-other-attribute', 'value');
        const config = parseDataAttributes(container);
        expect(Object.keys(config).length).toBe(0);
    });
    
    test('should handle multiple valid attributes', () => {
        container.setAttribute('data-snake-board-size', 'large');
        container.setAttribute('data-snake-cell-size', '30');
        container.setAttribute('data-snake-difficulty', 'hard');
        const config = parseDataAttributes(container);
        expect(config.board.preset).toBe('large');
        expect(config.board.cellSize).toBe(30);
        expect(config.difficulty.current).toBe('hard');
    });

    // Difficulty Tests
    describe('Difficulty Parsing', () => {
        test('should parse valid difficulty', () => {
            container.setAttribute('data-snake-difficulty', 'normal');
            const config = parseDataAttributes(container);
            expect(config.difficulty.current).toBe('normal');
        });
        
        test('should ignore invalid difficulty', () => {
            container.setAttribute('data-snake-difficulty', 'invalid');
            const config = parseDataAttributes(container);
            expect(config.difficulty?.current).toBeUndefined();
        });
        
        test('should convert difficulty to lowercase', () => {
            container.setAttribute('data-snake-difficulty', 'HARD');
            const config = parseDataAttributes(container);
            expect(config.difficulty.current).toBe('hard');
        });
        
        test('should handle all valid difficulties', () => {
            VALID_DIFFICULTIES.forEach(difficulty => {
                container.setAttribute('data-snake-difficulty', difficulty);
                const config = parseDataAttributes(container);
                expect(config.difficulty.current).toBe(difficulty);
            });
        });
    });
});
