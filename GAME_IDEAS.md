# AirConsole Game Ideas

Stack: TypeScript + Phaser 3 + Vite + AirConsole SDK
Pattern: screen.html (TV) + controller.html (phones)

---

## 1. UNO-style Card Game
**Difficulty:** Easy | **Time:** 1-2 weeks | **Players:** 2-6

Each player sees their own cards on the phone screen.
TV shows the discard pile and current color.
Actions: draw card, play card, say UNO.
Special cards: skip, reverse, +2, +4, color change.
Avoid UNO trademark — call it "CARDS DUEL" or similar.

**Monetization:** sell themed card packs (Halloween, Space, etc.)

---

## 2. Charades / Крокодил
**Difficulty:** Easy | **Time:** 1 week | **Players:** 3-8

One player gets a secret word on their phone.
They mime it — others shout guesses watching the TV.
TV shows timer, score, current round.
Phone shows: the word + PASS / GOT IT buttons.
Categories: movies, animals, professions, objects.

**Monetization:** category packs (18+, sports, cinema)

---

## 3. Mafia
**Difficulty:** Easy | **Time:** 1-2 weeks | **Players:** 4-10

Roles assigned secretly via phones (Mafia, Doctor, Detective, Civilian).
TV acts as the narrator screen showing day/night phase.
Night: mafia phones glow red, they vote who to eliminate.
Day: discussion, voting shown on TV.
No human host needed — fully automated.

**Monetization:** role expansion packs (Maniac, Lover, etc.)

---

## 4. Quiz / Trivia Night
**Difficulty:** Easy | **Time:** 1-2 weeks | **Players:** 2-8

TV shows question + countdown timer.
Each player taps their answer on the phone (A/B/C/D).
Points awarded by speed + correctness.
Categories: science, movies, history, music, sports.

**Monetization:** question packs by topic, difficulty, language

---

## 5. Bomberman
**Difficulty:** Medium | **Time:** 2-3 weeks | **Players:** 2-4

Classic arena bomber game on TV.
Phone = d-pad + bomb button.
Destructible walls, power-ups (speed, extra bombs, blast range).
Last player standing wins.
Short rounds (90 sec) — perfect for parties.

**Key tech:** Phaser arcade physics, tilemap, real-time multiplayer sync

---

## 6. Snake Battle
**Difficulty:** Easy-Medium | **Time:** 1-2 weeks | **Players:** 2-4

Multiple snakes on one grid (TV).
Phone swipes or taps direction buttons.
Eat food to grow, avoid walls and other snakes.
Last snake alive wins.
Power-ups: speed boost, shrink enemy, ghost mode.

**Monetization:** snake skins, special arenas

---

## 7. Tanks Arena
**Difficulty:** Medium | **Time:** 2-3 weeks | **Players:** 2-4

Top-down arena, each player controls a tank.
Phone: virtual joystick for movement + fire button.
Destructible walls, ricochet bullets, power-ups.
Lives system or time-based score.

**Key tech:** Phaser arcade physics, bullet pooling, tilemap

---

## 8. Alias / Word Explainer
**Difficulty:** Easy | **Time:** 1 week | **Players:** 4-8 (teams)

Teams of 2. One player explains — partner guesses.
Phone shows the word to explain + NEXT / SKIP buttons.
TV shows timer (60 sec), score per team, current word masked.
After round: TV reveals all words + which were guessed.
Categories: general, cinema, 18+, kids.

**Monetization:** word packs by category and difficulty

---

## 9. Poker (Texas Hold'em)
**Difficulty:** Hard | **Time:** 3-4 weeks | **Players:** 2-6

Each player's hole cards shown privately on their phone.
TV shows community cards, pot, current bets.
Phone actions: fold, call, raise (slider for amount).
Full Texas Hold'em hand ranking logic.
Chip system, tournament mode.

**Key tech:** hand evaluator algorithm, betting state machine

**Monetization:** chip bundles, tournament entry, table themes

---

## 10. Drawing & Guessing (Pictionary-style)
**Difficulty:** Medium | **Time:** 2 weeks | **Players:** 3-8

One player draws on their phone screen (canvas + color picker).
Drawing streams live to TV for others to see.
Others type guesses via phone keyboard.
First correct guess scores points.
Call it "DRAW DUEL" to avoid trademark.

**Key tech:** canvas streaming (send draw events via AirConsole messages)

**Monetization:** word packs, drawing tools/brushes as cosmetics

---

## Priority Recommendation

| Game | Effort | Fun Factor | Monetization |
|------|--------|-----------|--------------|
| Charades | ⭐ Low | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| UNO-style | ⭐⭐ Med | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Bomberman | ⭐⭐⭐ High | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Alias | ⭐ Low | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Drawing | ⭐⭐ Med | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**Best next project: Charades or Alias** — minimal logic, maximum party fun,
fast to build, high replay value, easy to monetize with word packs.
