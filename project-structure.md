```
snaked-again/
├── src/
│   ├── core/                 # Core game engine
│   │   ├── Engine.js         # Main game loop and initialization
│   │   ├── Grid.js          # Grid system and coordinate handling
│   │   └── Renderer.js      # p5.js rendering abstraction
│   │
│   ├── entities/            # Game entities
│   │   ├── Snake.js         # Snake logic and movement
│   │   ├── Food.js          # Food spawning and collision
│   │   └── PowerUp.js       # Power-up system
│   │
│   ├── config/             # Configuration system
│   │   ├── ConfigBuilder.js # Builder pattern for config
│   │   ├── schema.js       # Configuration schema and validation
│   │   └── defaults.js     # Default configuration values
│   │
│   ├── state/             # State management
│   │   ├── GameState.js   # Game state machine
│   │   └── store.js       # Global state store
│   │
│   ├── ui/               # UI Components
│   │   ├── Overlay.js   # Game overlay (score, power-ups)
│   │   ├── Menu.js      # Game menu
│   │   └── Controls.js  # Touch controls for mobile
│   │
│   └── utils/           # Utility functions
│       ├── math.js      # Math helpers
│       ├── viewport.js  # Screen/viewport calculations
│       └── debug.js     # Debug utilities
│
├── styles/             # Stylesheets
│   ├── game.css       # Game-specific styles
│   └── ui.css         # UI component styles
│
├── assets/            # Game assets
│   ├── sounds/        # Sound effects
│   └── images/        # Images and sprites
│
├── index.html         # Main entry point
├── package.json       # Project dependencies
└── README.md         # Project documentation
```
