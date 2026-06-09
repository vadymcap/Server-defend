// Definitions.ts
// @rbxts/net v3 typed remote definitions shared between client and server.
// Both places import this file; each place uses only the remotes it needs.

import Net from "@rbxts/net";
import type {
  GameMode,
  ToolType,
  ServiceType,
  TrafficType,
  Vector3Like,
  GameSnapshot,
  WarningMessage,
  ActiveEventState,
  FailureAnalysisPayload,
  SavePayload,
  SoundCategoryStateMap,
  TrafficDistributionPercent,
  TutorialStepState,
  TeleportData,
} from "../types/GameTypes";

const Remotes = Net.Definitions.Create({
  // ── Client → Server ─────────────────────────────────────────────────────

  /** Start a new game in the specified mode */
  sessionInit: Net.Definitions.ClientToServerEvent<[payload: { mode: GameMode }]>(),

  /** Resume a paused/open session */
  sessionResume: Net.Definitions.ClientToServerEvent<[]>(),

  /** Load a saved session from a slot */
  sessionLoad: Net.Definitions.ClientToServerEvent<[slot: string]>(),

  /** Pause / play / fast-forward */
  setTimeScale: Net.Definitions.ClientToServerEvent<[value: 0 | 1 | 3]>(),

  /** Change the active build/interact tool */
  setTool: Net.Definitions.ClientToServerEvent<[tool: ToolType]>(),

  /** Place a new service node on the grid */
  placeService: Net.Definitions.ClientToServerEvent<[
    payload: { type: ServiceType; pos: Vector3Like },
  ]>(),

  /** Upgrade a service node to the next tier */
  upgradeService: Net.Definitions.ClientToServerEvent<[serviceId: string]>(),

  /** Delete a service node */
  deleteService: Net.Definitions.ClientToServerEvent<[serviceId: string]>(),

  /** Connect two nodes (directional) */
  connectServices: Net.Definitions.ClientToServerEvent<[
    payload: { fromId: string; toId: string },
  ]>(),

  /** Remove a connection between two nodes */
  unlinkServices: Net.Definitions.ClientToServerEvent<[
    payload: { fromId: string; toId: string },
  ]>(),

  /** Move one or more nodes to new positions (after drag) */
  moveNodes: Net.Definitions.ClientToServerEvent<[
    payload: { ids: string[]; positions: Record<string, Vector3Like> },
  ]>(),

  /** Manual repair of a damaged service */
  repairService: Net.Definitions.ClientToServerEvent<[serviceId: string]>(),

  /** Toggle the auto-repair subsystem */
  toggleAutoRepair: Net.Definitions.ClientToServerEvent<[enabled: boolean]>(),

  // Sandbox-only controls

  sandboxSetBudget: Net.Definitions.ClientToServerEvent<[value: number]>(),
  sandboxSetRps: Net.Definitions.ClientToServerEvent<[value: number]>(),
  sandboxSetTrafficMix: Net.Definitions.ClientToServerEvent<[mix: TrafficDistributionPercent]>(),
  sandboxSpawnBurst: Net.Definitions.ClientToServerEvent<[
    payload: { type: TrafficType; count: number },
  ]>(),
  sandboxToggleUpkeep: Net.Definitions.ClientToServerEvent<[enabled: boolean]>(),

  // Post-game flow

  retrySameArchitecture: Net.Definitions.ClientToServerEvent<[]>(),
  restartSession: Net.Definitions.ClientToServerEvent<[]>(),

  // Persistence

  saveSlotWrite: Net.Definitions.ClientToServerEvent<[
    payload: { slot: string; data: SavePayload },
  ]>(),
  saveSlotRead: Net.Definitions.ServerAsyncFunction<(slot: string) => SavePayload | undefined>(),
  listSaveSlots: Net.Definitions.ServerAsyncFunction<() => string[]>(),

  // Tutorial

  tutorialAction: Net.Definitions.ClientToServerEvent<[
    payload: { action: string; data?: unknown },
  ]>(),

  // Sound settings (persisted)
  soundSettingsSet: Net.Definitions.ClientToServerEvent<[settings: SoundCategoryStateMap]>(),

  // ── Server → Client ─────────────────────────────────────────────────────

  /** Full world state snapshot (~10 Hz) */
  stateSnapshot: Net.Definitions.ServerToClientEvent<[snapshot: GameSnapshot]>(),

  /** Toast warning in the HUD warning stack */
  interventionWarning: Net.Definitions.ServerToClientEvent<[msg: WarningMessage]>(),

  /** Fired when a random event starts or ends */
  activeEventChanged: Net.Definitions.ServerToClientEvent<[event: ActiveEventState | undefined]>(),

  /** Fired when the session ends with failure analysis */
  gameOver: Net.Definitions.ServerToClientEvent<[payload: FailureAnalysisPayload]>(),

  /** Fired once when the game server is ready (loading → menu) */
  sessionReady: Net.Definitions.ServerToClientEvent<[]>(),

  /** Tutorial step state pushed from server (keeps both places in sync) */
  tutorialState: Net.Definitions.ServerToClientEvent<[step: TutorialStepState | undefined]>(),

  /** Fired by main-place server to send players to the game place */
  teleportToGame: Net.Definitions.ServerToClientEvent<[data: TeleportData]>(),
});

export = Remotes;
