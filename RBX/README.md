# Server Defend – Roblox (roblox-ts) Port

This folder contains a complete TypeScript (roblox-ts) implementation of the
**Server Defend** browser game, rebuilt as an identically playable Roblox
experience using:

| Concern | Package |
|---------|---------|
| Language | `roblox-ts` + TypeScript 5 |
| UI | `@rbxts/roact` + `@rbxts/roact-hooked` |
| Networking | `@rbxts/net` v3 |
| Persistence | `@rbxts/profilestore` |
| World sync | Rojo |

## Workspace layout

```
RBX/
  packages/
    shared/          ← domain types, config, net definitions, utilities
  places/
    main/            ← Main Place  (lobby, mode-select, party, teleport)
    game/            ← Game Place  (full simulation, camera, all HUD)
```

## Quick start

```bash
cd RBX
npm install

# Build everything
npm run build

# Sync a place with Rojo (run from the place folder)
cd places/main
rojo serve default.project.json

cd places/game
rojo serve default.project.json
```

## Two-place architecture

| Place | Responsibilities |
|-------|-----------------|
| **Main** | Main menu, mode selection, save management, settings, party creation, `TeleportService` dispatch |
| **Game** | Server-authoritative simulation loop, isometric camera, full gameplay HUD, end-of-run result |

Player data (saves, tutorial progress, stats, sound preferences) is persisted
in DataStore via `@rbxts/profilestore` on the **Game** place server.  When a
session ends the game server returns players to the Main place via
`TeleportService`.

## Milestones implemented

1. ✅ Bootstrap workspace + Rojo project files
2. ✅ Shared domain model (types, config, topology rules, net definitions)
3. ✅ Networking layer (`@rbxts/net` Definitions)
4. ✅ Server simulation core (Simulation, Routing, Economy systems)
5. ✅ Build/placement system + topology enforcement
6. ✅ Client isometric camera system
7. ✅ Core Roact UI (Main Menu, Gameplay HUD, Toolbar)
8. ✅ Advanced overlays (Tutorial, FAQ, Save, Game-over, Sound panel, Warnings)
9. ✅ Sandbox + MLOps mode variants
10. ✅ Persistence + teleport architecture
11. ✅ Loading screen + preload pipeline
