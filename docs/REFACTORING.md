# Snake Game Configuration Refactoring Plan

## Current Pain Points
1. Complex nested configuration structure
2. Global state management through singletons
3. Scattered validation logic
4. Limited HTML configuration options

## Implementation Phases

### Phase 1: Config Flattening
- [ ] Create new flat config structure
- [ ] Update validation for flat structure

```javascript
// Before
config.board.presets.fullscreen.cellSize
config.difficulty.presets.normal.baseSpeed

// After
config.cellSize
config.baseSpeed
config.mode        // 'fullscreen', 'windowed'
config.difficulty  // 'easy', 'normal', 'hard'
```

### Phase 2: State Management
- [ ] Implement event system for config changes
- [ ] Add middleware support
- [ ] Make config immutable
- [ ] Add state change tracking

```javascript
const game = new Game({
  config: baseConfig,
  middleware: [
    localStorageMiddleware,
    dataAttributeMiddleware,
    validationMiddleware
  ]
});

game.on('config:change', (newConfig) => {
  // React to config changes
});
```

### Phase 3: Unified Validation
- [ ] Create unified config schema
- [ ] Add runtime type checking
- [ ] Improve error messages
- [ ] Add development-time validation

```javascript
const GameConfig = {
  cellSize: {
    type: 'number',
    min: 20,
    max: 100,
    default: 50
  },
  mode: {
    type: 'enum',
    values: ['fullscreen', 'windowed'],
    default: 'windowed'
  },
  difficulty: {
    type: 'enum',
    values: ['easy', 'normal', 'hard'],
    default: 'normal'
  }
};
```

### Phase 4: HTML Integration
- [ ] Implement data attributes support
- [ ] Add web component foundation
- [ ] Create composable game components
- [ ] Add responsive layout support

```html
<!-- Simple Data Attributes -->
<div id="game-container"
     data-mode="fullscreen"
     data-cell-size="50"
     data-difficulty="normal">
</div>

<!-- Future Web Component -->
<snake-game
  mode="fullscreen"
  cell-size="50"
  difficulty="normal"
  debug>
  
  <game-controls wasd></game-controls>
  <game-scoreboard position="top-right"></game-scoreboard>
</snake-game>
```

## Migration Strategy
1. Each phase will maintain backward compatibility
2. Deprecation warnings will guide developers to new APIs
3. Documentation will be updated with each phase
4. Unit tests will cover both old and new implementations

## Benefits
- ✅ Simpler mental model
- ✅ Better developer experience
- ✅ Easier testing
- ✅ More maintainable code
- ✅ Type-safe configurations
- ✅ Declarative setup options
