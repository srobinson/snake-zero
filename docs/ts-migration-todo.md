# TypeScript Migration Todo List

This document tracks the migration status of functions from main.js_ to main.ts.

## Class Methods
- [x] constructor()
- [x] setupEventListeners()
- [x] setupResizeHandler()
- [x] setup(p5)
- [x] update()
- [x] applyPowerup(type, powerUpPosition)
- [x] addPowerupBadge(type, powerUpPosition)
- [x] draw()
- [x] drawGame()
- [x] drawMenu()
- [x] drawPauseOverlay()
- [x] drawGameOver()
- [x] drawScore()
- [x] handleInput(key, isShiftPressed)
- [x] recreate()
- [x] reset()

## Global Functions
- [x] touchStarted(event)
- [x] touchEnded(event)

## Migration Status
For each function, we need to verify:
1. All functionality is migrated ✅
2. Type definitions are correct ✅
3. Error handling is appropriate ✅
4. Documentation is preserved ✅
5. Function signature matches or is properly typed ✅

Migration complete! All functions have been successfully migrated to TypeScript.
