# PRD: Nexus Arena

Fast-paced Hero Shooter combat in a top-down arena.

## Game Overview
- **Objective**: Capture and hold the Central Zone to reach 100 points.
- **Teams**: 5v5 (Blue vs Red).
- **Core Loop**: Select Hero -> Battle in Arena -> Capture Zone -> Victory.

## Heroes
### Titan (Tank)
- **Role**: Frontline anchor.
- **Weapon**: Scatter Gun (Spread).
- **Ability**: Charge (Dash).
- **Ultimate**: Earthshatter (AOE Stun).

### Wraith (Damage)
- **Role**: High-mobility assassin.
- **Weapon**: Plasma Rifle (Straight).
- **Ability**: Blink (Teleport).
- **Ultimate**: Overclock (Fire Rate & Speed Buff).

### Aura (Support)
- **Role**: Team healer.
- **Weapon**: Energy Dart (Straight).
- **Ability**: Healing Wave (Projectile Heal).
- **Ultimate**: Resurgence (Large AOE Heal).

## Technical Implementation
- **Core Logic**: Vanilla Canvas-based engine in `@arcade/lib-heroarena`.
- **Platform**: React + Stitches in `web/arcade`.
- **Protocol**: Bridge Protocol compatible (Events for score, player status, and game state).

## Controls
- **WASD**: Move
- **Mouse**: Aim
- **LMB**: Primary Fire
- **SHIFT**: Ability
- **Q**: Ultimate
