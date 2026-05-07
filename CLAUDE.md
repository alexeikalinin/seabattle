You are a senior multiplayer web game engineer.

Create a complete production-ready AirConsole game project called "Battleship Duel".

The game is a local multiplayer Battleship game for 2 players:
- shared screen on TV/projector/browser
- smartphones are controllers using AirConsole
- no online matchmaking
- couch multiplayer only
- optimized for AirConsole architecture

IMPORTANT:
The game MUST fully follow AirConsole architecture and Quick Start guidelines:
- screen.html for shared screen
- controller.html for smartphones/controllers
- communication via AirConsole SDK
- use AirConsole message system correctly
- support reconnects
- never assume fixed device IDs
- support exactly 2 players

Tech stack:
- TypeScript
- Phaser 3
- Vite
- AirConsole SDK
- modern modular architecture
- clean code
- mobile-first controller UI
- responsive layout

Generate the ENTIRE project structure.

====================================================
PROJECT REQUIREMENTS
====================================================

Create a polished MVP with:
- beautiful modern UI
- smooth animations
- sound effects support
- responsive design
- scalable architecture
- maintainable code

====================================================
GAME FLOW
====================================================

1. Shared screen opens
2. Lobby screen appears
3. Players connect with smartphones
4. Each player gets assigned:
   - Player 1
   - Player 2
5. Both players press READY
6. Ship placement phase starts
7. Battle phase starts
8. Turn-based gameplay
9. Winner screen
10. Restart option

====================================================
GAME RULES
====================================================

Classic Battleship rules:
- 10x10 grid
- ships:
  - 1x4
  - 2x3
  - 3x2
  - 4x1
- players place ships manually
- ships cannot overlap
- ships cannot touch
- turn-based attacks
- hit/miss markers
- sunk ship detection
- victory detection

====================================================
AIRCONSOLE REQUIREMENTS
====================================================

Use AirConsole SDK correctly.

Create:
- screen.html
- controller.html

Use:
- AirConsole.onConnect
- AirConsole.onDisconnect
- AirConsole.onMessage

Use proper device management:
- never hardcode device IDs
- maintain player registry
- reconnect support

Controller sends actions to screen.

The screen is authoritative:
- all game state lives on screen
- controller only sends inputs

====================================================
CONTROLLER REQUIREMENTS
====================================================

Controller UI must support:
- lobby state
- ready button
- ship placement
- rotate ship button
- attack selection
- turn indicators
- hit/miss feedback
- victory/defeat screen

Controller UI should:
- feel like a Nintendo Switch party game
- large touch targets
- minimal latency
- portrait orientation

====================================================
SCREEN REQUIREMENTS
====================================================

Shared screen should display:
- animated background
- lobby
- player status
- both boards
- current turn
- attack animations
- hit effects
- sunk ship effects
- victory screen

Style:
- modern
- neon navy
- polished arcade aesthetic
- cinematic transitions

====================================================
ARCHITECTURE REQUIREMENTS
====================================================

Use clean architecture.

Create folders:
- src/game
- src/scenes
- src/airconsole
- src/controllers
- src/ui
- src/state
- src/utils
- src/types
- src/assets

Use:
- GameState manager
- Player manager
- Ship placement validator
- Turn manager
- Message router
- AirConsole adapter layer

====================================================
PHASER REQUIREMENTS
====================================================

Use Phaser 3 scenes:
- BootScene
- PreloadScene
- LobbyScene
- PlacementScene
- BattleScene
- ResultScene

Implement:
- smooth transitions
- particle effects
- tween animations
- responsive scaling

====================================================
MULTIPLAYER SYNCHRONIZATION
====================================================

The shared screen is the single source of truth.

Controllers NEVER store authoritative state.

Implement:
- message protocol
- typed messages
- validation
- anti-desync logic

Example actions:
- READY
- PLACE_SHIP
- ROTATE_SHIP
- ATTACK_CELL
- RESTART_GAME

====================================================
TYPESCRIPT REQUIREMENTS
====================================================

Strong typing everywhere.

Create:
- interfaces
- enums
- message types
- game state types

No any types.

====================================================
DEV EXPERIENCE
====================================================

Provide:
- npm scripts
- Vite config
- TypeScript config
- README
- setup instructions

====================================================
LOCAL TESTING
====================================================

Support:
- AirConsole simulator
- localhost development
- mobile testing

Document:
- how to run locally
- how to connect phones
- how to test multiplayer

====================================================
EXTRA POLISH
====================================================

Add:
- sound manager
- hover effects
- attack animations
- water ripple effects
- ship destruction effects
- turn transition animations
- subtle screen shake

====================================================
OUTPUT FORMAT
====================================================

Generate:
1. Full folder structure
2. All files
3. Important code implementations
4. AirConsole integration
5. Message system
6. Phaser scenes
7. README
8. Setup instructions

Prioritize:
- clean architecture
- maintainability
- multiplayer stability
- polished UX
- proper AirConsole implementation

Do NOT generate pseudo-code.
Generate real production-ready code.