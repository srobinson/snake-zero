# 🐍 Snake Zero

A modern, educational implementation of the classic Snake game, designed for children aged 5-7. Built with p5.js, featuring customizable configurations and responsive controls.

## 🎮 Features

- 🖥️ Multiple display modes (fullscreen, preset sizes, custom dimensions)
- ⌨️ Responsive controls (Arrow keys, WASD, and touch support)
- ⚡ Power-up system with various effects
- 🏆 Achievement system with rewards
- 🎵 Dynamic sound effects and music
- ⚔️ Multiple difficulty levels
- 🔄 Combo system with multipliers
- 📊 Score tracking and persistence
- 🎨 Child-friendly visuals with particle effects
- ⚙️ Highly configurable

## 🚀 Quick Start

1. Clone the repository
2. Open `index.html` in a modern web browser
3. Select your difficulty level (Easy, Normal, or Hard)
4. Use arrow keys, WASD, or touch controls to play

## 🎯 Controls

- **Arrow Keys** or **WASD**: Control snake direction
  - ↑ or W: Move up
  - ↓ or S: Move down
  - ← or A: Move left
  - → or D: Move right
- **Touch Controls**: Swipe in desired direction (mobile devices)
- **Board Size Controls**:
  - Q: Small board
  - W: Medium board
  - E: Large board
  - R: Toggle fullscreen mode
- **Debug Controls** (when debug mode is enabled):
  - D: Toggle debug panel
  - 1-3: Spawn power-ups
  - +/-: Adjust cell size

## 🏆 Achievements

- **Speed Demon**: Reach maximum speed
- **Combo Master**: Achieve 8x multiplier
- **Ghost Rider**: Collect 3 ghost power-ups
- **Snake Charmer**: Reach length 30

## ⚙️ Configuration

Snake Zero features a flexible configuration system with multiple ways to customize the game:

### HTML Data Attributes

The easiest way to configure the game is through HTML data attributes:

```html
<div id="snaked-again-container"
     data-snake-board-size="fullscreen"
     data-snake-cell-size="20"
     data-snake-difficulty="normal">
</div>
```

#### Available Data Attributes

1. **Board Size** (`data-snake-board-size`)
   - Values: `small`, `medium`, `large`, `fullscreen`
   - Controls the game board dimensions
   - Example: `data-snake-board-size="medium"`

2. **Cell Size** (`data-snake-cell-size`)
   - Values: `10` to `100` (pixels)
   - Controls the size of grid cells
   - Example: `data-snake-cell-size="20"`

3. **Difficulty** (`data-snake-difficulty`)
   - Values: `easy`, `normal`, `hard`
   - Controls game speed and mechanics
   - Example: `data-snake-difficulty="normal"`

### Configuration Priority

The game uses a clear configuration hierarchy:

1. HTML Data Attributes (Highest Priority)
   - Overrides all other settings
   - Perfect for quick customization

2. Local Storage Configuration
   - Persists between sessions
   - Stores user preferences

3. Default Configuration (Lowest Priority)
   - Fallback values
   - Base game settings

### JavaScript Configuration

For more advanced customization, you can modify the configuration through JavaScript:

```javascript
// Get the game's configuration manager
import configManager from './src/config/gameConfig.js';

// Example 1: Override specific settings
configManager.override({
    difficulty: {
        current: 'hard',
        presets: {
            hard: {
                baseSpeed: 15,      // Custom speed
                powerUpChance: 0.01 // Custom power-up frequency
            }
        }
    }
});

// Example 2: Custom board configuration
configManager.override({
    board: {
        preset: 'custom',
        presets: {
            custom: {
                width: 1000,
                height: 800,
                cellSize: 25
            }
        }
    }
});

// Example 3: Reset to defaults
configManager.reset();

// Example 4: Save current configuration
configManager.saveToLocalStorage();
```

The configuration manager provides methods to:
- `override(config)`: Apply custom settings
- `reset()`: Restore default settings
- `saveToLocalStorage()`: Persist settings
- `getConfig()`: Get current configuration

### Board Presets

The game comes with predefined board sizes that can be selected via data attributes or JavaScript:

```javascript
// Available board presets
const boardPresets = {
    small: {     // Perfect for quick games
        width: 400, 
        height: 400, 
        cellSize: 20    // 20x20 grid
    },
    medium: {    // Balanced gameplay
        width: 800, 
        height: 600, 
        cellSize: 20    // 40x30 grid
    },
    large: {     // Challenge mode
        width: 1200, 
        height: 800, 
        cellSize: 20    // 60x40 grid
    },
    fullscreen: {  // Immersive experience
        width: "auto",    // Adapts to window width
        height: "auto",   // Adapts to window height
        cellSize: 20      // Responsive grid
    }
}
```

## 🎲 Game Mechanics

### Movement
- Use Arrow keys or WASD for directional control
- Swipe gestures on touch devices
- Smooth, responsive controls

### Scoring
- Each food item: 10 points
- Power-ups provide bonus points
- Score multiplies with consecutive quick catches

### Power-ups
- Speed boost: Temporary speed increase
- Ghost mode: Pass through walls
- Points multiplier: Double points
- Random spawn rate based on difficulty

### Difficulty Progression
- Speed increases as you collect food
- Power-up frequency adjusts with difficulty
- Custom difficulty presets available

## 🎯 Educational Goals

Snake Zero is designed to help children develop:
- Hand-eye coordination
- Strategic thinking
- Quick decision making
- Pattern recognition
- Spatial awareness

## 🛠️ Technical Details

- Built with p5.js
- Modular architecture
- Config-driven development
- Responsive design
- Performance optimized (60 FPS)
- Local storage for progress
- Touch-enabled for mobile

## 🧩 Project Structure

```
snake-zero/
├── src/
│   ├── config/
│   │   ├── configManager.js   # Configuration management
│   │   └── gameConfig.js      # Default configurations
│   ├── entities/
│   │   ├── Snake.js          # Snake logic
│   │   ├── Food.js           # Food spawning
│   │   └── PowerUp.js        # Power-up system
│   ├── utils/
│   │   └── boardConfig.js    # Board configuration
│   └── game.js               # Core game logic
├── index.html                # Game entry point
└── README.md                 # Documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Original Snake game concept
- p5.js library and community
- Contributors and testers
