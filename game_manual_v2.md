# 🎮 Sweeble v2 — Official Game Manual

Welcome to **Sweeble v2**, the streamlined 5-Day AI Swarm Productivity Runner!

In v2, you play as **Swé 🦦**, an engineering manager overseeing up to 5 cute AI pet agents across a **5-Day Work Week** (5 sleep cycles, Monday through Friday) with the ultimate goal of reaching **100% Weekly Productivity**!

---

## 🎯 1. Final Sprint Goals & Evaluation

When a 5-day sprint concludes, your team is evaluated against **3 Final Goals**:

1. **⚡ 1) % of Productivity**:
   - Target: **$100\%$ Weekly Productivity**
   - Graded: **🌟 S+ Tier** ($\ge 95\%$), **🏆 A Tier** ($\ge 80\%$), **👍 B Tier** ($\ge 60\%$), or **⚠️ C Tier** ($< 60\%$).
2. **🪙 2) % of Total Tokens Used**:
   - Measures token utilization efficiency: total compute tokens burned by active squad members relative to total compute maxxed from the pipeline.
3. **💀 3) Lives Lost**:
   - Measures squad survival: the number of times pet agents depleted their tokens or were defeated by unjumped obstacles.
   - Aim for **0 Lives Lost (🌟 Flawless Run!)**!

---

## 👥 2. Swé & The 5 Cute Pet Agents (Pastel Palette)

| Track / Level | Squad Member | Pastel Base | Accent Color | Assigned Lane Tint |
| :---: | :---: | :---: | :---: | :---: |
| **Track 1 (Level 1)** | `Flower 🌸` | 🌿 **Pastel Mint** (`#6EE7B7`) | `#059669` | `#ECFDF5` *(Soft Sage)* |
| **Track 2 (Level 2)** | `Lil Peach 🍑` | 🍑 **Pastel Peach** (`#FDA4AF`) | `#E11D48` | `#FFF1F2` *(Blush Cream)* |
| **Track 3 (Level 3)** | `Pal 🐾` | 🌼 **Pastel Buttercup** (`#FDE047`) | `#D97706` | `#FEFCE8` *(Warm Custard)* |
| **Track 4 (Level 4)** | `Acorn 🌰` | 🍇 **Pastel Lavender** (`#C4B5FD`) | `#7C3AED` | `#F5F3FF` *(Lilac Dream)* |
| **Track 5 (Level 5)** | `Sprout 🌱` | ☁️ **Pastel Sky Blue** (`#7DD3FC`) | `#0284C7` | `#F0F9FF` *(Azure Ice)* |

---

## 🕹️ 3. Controls: Click-to-Recruit & Click-to-Jump

1. **➕ Click-to-Recruit (Hiring Agents)**:
   - Each sprint starts with **0 active agents**.
   - Solid color blocks matching each track's pastel color scroll down empty lanes.
   - **Click the color block** (or anywhere in the lane) to instantiate that track's agent with $100\text{ compute tokens}$!
2. **🦘 Click-to-Jump**:
   - **Mouse / Tap**: Click on an active agent or anywhere in its lane to make it **JUMP** over oncoming obstacles.
   - **Keyboard Keys**: Press <kbd>1</kbd>, <kbd>2</kbd>, <kbd>3</kbd>, <kbd>4</kbd>, or <kbd>5</kbd> for instant lane jumps.
   - **Spacebar**: Press <kbd>Space</kbd> to jump all active agents simultaneously!
3. **⚙️ Customizable Keybindings & Settings Panel**:
   - Click the **`⚙️ Custom Keybindings & Settings`** button on the main menu.
   - Click on any action button (e.g. *Jump Lane 1*, *Jump All*, *Pause*, *Quit*) and press any key on your keyboard to customize your key layout!
   - Keybindings are automatically saved to `localStorage` and persist across sessions.
   - Click **`🔄 Reset Defaults`** anytime to revert to standard keys (<kbd>1</kbd>–<kbd>5</kbd>, <kbd>Space</kbd>, <kbd>P</kbd>, <kbd>Q</kbd>).
4. **⏸️ Pause / Resume & 🚪 Quit**:
   - Press <kbd>P</kbd> or <kbd>Esc</kbd> at any time to pause/resume the game (or your custom bound key).
   - Or click the **`⏸️ Pause` / `▶️ Resume`** button in the top-right corner of the HUD.
   - While paused, press <kbd>Q</kbd> or click **`🚪 Quit to Menu`** to exit the sprint and return to the main menu.

---

## 🏎️ 4. Independent Track Speeds & Timeline

- **Independent Velocities**: Every track progresses at its own speed based on how well that agent avoids obstacles and collects compute tokens.
- **Timeline & Sleep Cycles**: Each track features its own vertical 5-day progress bar (`Day 3/5 • 🌙 2/5 Sleeps`). A well-managed, energized agent will reach Friday night (Day 5) faster than a stumbling track.

---

## 🪙 5. Token Economy & Death

- **Token Burn**: Active agents consume tokens over time ($-3.5\text{ tokens/sec}$).
- **Death**: If an agent hits $0\text{ tokens}$, it deactivates and the track goes idle. Click the next solid color block in that lane to rehire a fresh agent!
- **Power-Ups (Life Givers)**:
  - 🪙 **Compute Tokens**: $+25\text{ tokens}$ + golden shockwave burst.
  - ⚡ **Energy Surge**: $+40\text{ tokens}$ + $1.45\times$ speed boost for $4\text{s}$.
  - 🌸 **Matching Color Blocks**: $+30\text{ tokens}$ + size surge.

---

## 🚧 6. Obstacles (Jump to Clear!)

- 🐛 **Software Bugs & Crashes (`ItemType.BugObstacle`)**:
  - `🐛 Production Bug`, `🐞 Null Pointer Crash`, `💥 Memory Leak`, `🔥 Outage Alarm`
  - *Penalty*: $-35\text{ tokens}$ + trip slowdown.
- 🕳️ **Synchronized Black Obstacle Waves (`ItemType.TarObstacle` & `ItemType.DreadObstacle`)**:
  - `🕳️ Black Tar Pit`, `⛓️ Merge Conflict`, `🧱 Dependency Hell`, `💀 Existential Dread`, `😴 AI Fatigue`, `🌋 Doom Wall`
  - *Multi-Node Synchronization*: Black obstacles **spawn simultaneously across all active tracks**, forming a synchronized hurdle wall!
  - *Penalty if Hit*: $-30\text{ tokens}$ + cancels active compute aura and grounds the agent.
  - *Strategy*: Hit <kbd>Space</kbd> to jump all agents simultaneously over the incoming wall!
- 📅 **Pop-up Meetings (`ItemType.MeetingObstacle`)**:
  - `📅 Unscheduled 1:1`, `📢 Sync Meeting (30m)`, `📝 Status Update`
  - *Penalty*: $-20\text{ tokens}$ + cuts track speed in half ($0.45\times$) for $3\text{s}$.
- ⚡ **Electrified CI/CD Glitches (`ItemType.GlitchObstacle`)**:
  - `⚡ Flaky CI/CD`, `👾 Glitch in Prod`, `🛑 Rate Limit Error`
  - *Penalty*: $-40\text{ tokens}$ + screen flicker.
- **Jump Clearance**: When you leap over any obstacle with proper jump timing, the agent safely avoids the penalty and earns bonus productivity with clearance sparkles!

---

© 2026 Sweeble. All rights reserved.
