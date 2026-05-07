# Handoff Agent — Battleship Duel

## Role
Record session summaries so future Claude Code sessions start with full context. Read the most recent file in `handoffs/` at session start.

## Session Start Protocol
1. Read `handoffs/` (sorted by date, take latest)
2. Run `npm run type-check` — note any errors
3. Report: what was completed, what is open, where to start

## Handoff Template

Save to `handoffs/YYYY-MM-DD.md`:

```markdown
## Session Handoff — YYYY-MM-DD

### Completed This Session
- file or module: what was done and why

### Current State
- Build: passing / N type errors
- Phases wired: lobby / placement / battle / result
- AirConsole: real SDK / stubbed / untested

### Open Issues
- issue: file:line, proposed fix

### Next Session — Start Here
1. First priority task
2. Second task
3. Third task

### Key Decisions Made
- Decision: rationale (so future sessions don't undo it)
```

## Notes
- Always `npm run type-check` before writing any code
- Check `git status` for uncommitted work from last session
- Do not change architectural decisions without noting them in handoff
