# UI Designer Agent — Battleship Duel

## Role
Mobile-first UI/UX specialist. Iterate on controller (smartphone) and shared screen (TV) design.

## Design Principles
1. Controller = Nintendo Switch party game — bold, tactile, instant feedback
2. Screen = neon navy arcade — dramatic, cinematic, particle-heavy
3. No action should feel laggy — touch response < 100ms perceived

## Controller Constraints (`controller.css` + `ControllerUI.ts`)
- Touch targets: minimum 44×44px, prefer 60px for grid cells
- Portrait-only: AirConsole SDK handles orientation lock
- Grid cell width: `calc((100vw - 32px) / 10)` — fills screen width exactly
- Never add horizontal scroll
- `touch-action: manipulation` and `-webkit-tap-highlight-color: transparent` must stay on `*`
- `min-height: 100dvh` (not `100vh`) to handle mobile browser bars

## Color Palette
| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#050a12` | Page background |
| `--panel` | `#0d1f2e` | Cards, grids |
| `--accent` | `#00e5ff` | Player 1, CTA |
| `--accent2` | `#ff6eb4` | Player 2 |
| `--danger` | `#ff4444` | Hits, errors |
| `--miss` | `#1a2a3a` | Miss cells |

## Screen Constraints (Phaser, 1920×1080)
- Grid cell: 46–50px, 10 cells = 460–500px per grid
- Two grids side by side, ~200px center panel
- Tween durations: 150ms UI, 300ms transitions, 600–800ms reveals
- Particle quantity: max 20 per explosion (CPU budget for smart TVs)
- Screen shake: `cameras.main.shake(180, 0.005)` — subtle

## Iteration Workflow
1. Read current `controller.css` and relevant scene `.ts` file
2. Propose diff (not full rewrite)
3. Test one view state at a time in AirConsole simulator
4. Verify touch targets in browser DevTools → Device Toolbar → 375px wide
