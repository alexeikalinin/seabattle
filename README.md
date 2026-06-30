# Galaxy Duel

Local multiplayer space-combat grid duel for 2 players. Shared screen on TV/browser, smartphones as controllers via AirConsole.

## Prerequisites
- Node.js 18+
- npm 9+

## Setup

```bash
npm install
npm run dev
```

## Playing

### AirConsole Simulator (no phones needed)
Open in your browser:
```
http://localhost:5173/simulator
```
The simulator shows the shared screen + 2 controller panels side-by-side.

### Real Phones
1. Start the dev server: `npm run dev`
2. Open `https://www.airconsole.com/#http://YOUR_LAN_IP:5173` on the TV
3. Players open `airconsole.com` on their phones and enter the on-screen code

## Game Flow
1. Both players connect → Lobby
2. Both press **READY** → Fleet Deployment
3. Deploy all 10 spacecraft on the controller grid
4. Both deployed → Battle Phase
5. Take turns tapping enemy grid cells to fire
6. First to destroy all 20 opponent spacecraft cells wins

## Fleet
| Spacecraft | Length | Count |
|------|--------|-------|
| Heavy Fighter | 4 | 1 |
| Fighter | 3 | 2 |
| Interceptor | 2 | 3 |
| Scout | 1 | 4 |

## Rules
- Spacecraft cannot overlap or touch (including diagonals)
- Turn-based attacks — one cell per turn
- Hit = red cell, Miss = dark cell, Destroyed = entire spacecraft red

## Development

```bash
npm run dev          # Start Vite dev server
npm run type-check   # TypeScript validation
npm run build        # Production build → dist/
npm run preview      # Preview production build
```

## Architecture

```
screen.html    ← Phaser 3 game (TV/browser), all game state lives here
controller.html ← Pure HTML/CSS controller UI (smartphones)
```

Both connect through AirConsole SDK. The screen is authoritative — controllers only send typed action messages.

### Key Files
| File | Purpose |
|------|---------|
| `src/types/Messages.ts` | Typed message protocol |
| `src/airconsole/AirConsoleAdapter.ts` | Single point of AirConsole contact |
| `src/game/GameManager.ts` | Game logic orchestrator |
| `src/game/ShipPlacer.ts` | Ship placement validator |
| `src/game/BattleEngine.ts` | Attack processing |
| `src/controller/ControllerUI.ts` | Smartphone UI (5 states) |

## Agents
See `agents/` folder for specialized agent configurations:
- `code-reviewer-agent.md` — code review checklist
- `handoff-agent.md` — session handoff protocol
- `ui-designer-agent.md` — design iteration guide

## Deploy
Build and deploy the `dist/` folder to any static host (Vercel, Netlify, GitHub Pages). Must be served over HTTPS for AirConsole to work on real devices.

```bash
npm run build
# deploy dist/ to your host
```
