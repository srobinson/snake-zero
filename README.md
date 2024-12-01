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

Snake Zero features a powerful configuration system that allows customization of various game aspects.

### Difficulty Levels

```javascript
{
    difficulty: {
        current: 'normal',  // 'easy', 'normal', or 'hard'
        presets: {
            easy: {
                baseSpeed: 5,
                powerUpChance: 0.02
            },
            normal: {
                baseSpeed: 8,
                powerUpChance: 0.01
            },
            hard: {
                baseSpeed: 12,
                powerUpChance: 0.005
            }
        }
    }
}
```

### Speed Progression

The snake's speed increases as you collect food, making the game progressively more challenging:

```javascript
{
    snake: {
        speedProgression: {
            enabled: true,          // Enable/disable speed progression
            increasePerFood: 0.2,   // Speed increase per food eaten
            maxSpeed: 15,          // Maximum speed cap
            initialSpeedBoost: 1.5, // Speed power-up multiplier
            slowEffect: 0.5        // Slow power-up multiplier
        }
    }
}
```

### Board Size Options

The game supports multiple board sizes that can be changed during gameplay:

```javascript
{
    board: {
        preset: 'fullscreen',  // Current preset: 'small', 'medium', 'large', or 'fullscreen'
        presets: {
            small: { width: 400, height: 400, cellSize: 20 },    // 20x20 grid
            medium: { width: 800, height: 600, cellSize: 20 },   // 40x30 grid
            large: { width: 1200, height: 800, cellSize: 20 },   // 60x40 grid
            fullscreen: { width: "window.innerWidth", height: "window.innerHeight", cellSize: 50 }  // Custom cell size
        }
    }
}
```

You can initialize the game in fullscreen with custom settings by either:

1. Modifying the config before game starts:
```javascript
const config = {
    board: {
        preset: 'fullscreen',
        presets: {
            fullscreen: {
                width: window.innerWidth,
                height: window.innerHeight,
                cellSize: 50  // Custom cell size
            }
        }
    }
};
window.setGameConfig(config);
```

2. Or using the debug controls during gameplay:
   - R: Toggle fullscreen mode
   - Use + and - keys to adjust cell size to 50

You can change the board size during gameplay using:
- Q: Switch to small board
- W: Switch to medium board
- E: Switch to large board
- R: Toggle fullscreen mode

### Sound Settings

```javascript
window.setGameConfig({
    sound: {
        enabled: true,
        volume: 0.7,
        music: {
            enabled: true,
            volume: 0.5
        }
    }
});
```

### Visual Customization

```javascript
window.setGameConfig({
    visuals: {
        background: [51, 51, 51],  // RGB values
        grid: {
            color: [100, 100, 100],
            weight: 1
        },
        particles: {
            enabled: true
        }
    }
});
```

### Combo System

```javascript
window.setGameConfig({
    combo: {
        timeoutMs: 3000,  // Time to maintain combo
        visual: {
            pulseOnIncrease: true
        }
    }
});
```

## 🎲 Game Mechanics

- Snake grows when eating food
- Game ends if snake hits walls or itself (except in ghost mode)
- Power-ups appear randomly with special effects:
  - Speed boost
  - Slow motion
  - Ghost mode (pass through walls)
  - Double points
- Combo system multiplies score up to 8x
- Achievements unlock for special accomplishments
- Progress and high scores are automatically saved

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

## 🎨 Design Philosophy

- **Child-Friendly**: Simple, intuitive interface for young players
- **Engaging**: Dynamic effects, sounds, and achievements
- **Configurable**: Extensive customization options
- **Performant**: Optimized for smooth gameplay
- **Modular**: Clean, maintainable code structure
- **Responsive**: Works on both desktop and mobile

## 🔄 Future Enhancements

- Additional achievement types
- More power-up variations
- Multiplayer support
- Custom themes
- Educational mode with math challenges

## 📝 License

MIT License - feel free to use and modify as needed!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
