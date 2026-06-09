// bootstrap.server.ts  –  Game Place server entry point
// Reads TeleportData, loads player profile, starts simulation.

import { Players, TeleportService } from "@rbxts/services";
import Remotes from "@server-defend/shared/net/Definitions";
import { SimulationSystem } from "./systems/SimulationSystem";
import { BuildSystem } from "./systems/BuildSystem";
import { loadProfile, saveProfile } from "./persistence/ProfileService";
import type { TeleportData } from "@server-defend/shared/types/GameTypes";

// Per-player simulation instances
const simulations = new Map<number, SimulationSystem>();

Players.PlayerAdded.Connect((player) => {
  // Load profile (creates if new)
  const profile = loadProfile(player);

  // Recover TeleportData embedded by Main Place
  let teleportData: TeleportData | undefined;
  const [ok, data] = pcall(() =>
    TeleportService.GetLocalPlayerTeleportData() as TeleportData | undefined,
  );
  if (ok && data !== undefined) {
    teleportData = data;
  }

  const mode = teleportData?.gameMode ?? "survival";

  // Start a new simulation for this player
  const sim = new SimulationSystem(player, mode, profile);
  simulations.set(player.UserId, sim);
  sim.start();

  print(`[Game Server] ${player.Name} joined, mode=${mode}`);
});

Players.PlayerRemoving.Connect((player) => {
  const sim = simulations.get(player.UserId);
  if (sim) {
    sim.stop();
    simulations.delete(player.UserId);
  }
  saveProfile(player);
});

// ── Remote handlers ──────────────────────────────────────────────────────

function withSim(player: Player, fn: (sim: SimulationSystem) => void): void {
  const sim = simulations.get(player.UserId);
  if (sim) fn(sim);
}

Remotes.Server.Get("sessionInit").Connect((p, payload) =>
  withSim(p, (s) => s.setMode(payload.mode)));

Remotes.Server.Get("setTimeScale").Connect((p, v) =>
  withSim(p, (s) => s.setTimeScale(v)));

Remotes.Server.Get("setTool").Connect((p, tool) =>
  withSim(p, (s) => s.setTool(tool)));

Remotes.Server.Get("placeService").Connect((p, payload) =>
  withSim(p, (s) => BuildSystem.placeService(s, payload.type, payload.pos)));

Remotes.Server.Get("upgradeService").Connect((p, serviceId) =>
  withSim(p, (s) => BuildSystem.upgradeService(s, serviceId)));

Remotes.Server.Get("deleteService").Connect((p, serviceId) =>
  withSim(p, (s) => BuildSystem.deleteService(s, serviceId)));

Remotes.Server.Get("connectServices").Connect((p, payload) =>
  withSim(p, (s) => BuildSystem.connectServices(s, payload.fromId, payload.toId)));

Remotes.Server.Get("unlinkServices").Connect((p, payload) =>
  withSim(p, (s) => BuildSystem.unlinkServices(s, payload.fromId, payload.toId)));

Remotes.Server.Get("moveNodes").Connect((p, payload) =>
  withSim(p, (s) => BuildSystem.moveNodes(s, payload.ids, payload.positions)));

Remotes.Server.Get("repairService").Connect((p, serviceId) =>
  withSim(p, (s) => s.repairService(serviceId)));

Remotes.Server.Get("toggleAutoRepair").Connect((p, enabled) =>
  withSim(p, (s) => s.setAutoRepair(enabled)));

Remotes.Server.Get("sandboxSetBudget").Connect((p, v) =>
  withSim(p, (s) => s.setSandboxBudget(v)));

Remotes.Server.Get("sandboxSetRps").Connect((p, v) =>
  withSim(p, (s) => s.setSandboxRPS(v)));

Remotes.Server.Get("sandboxSetTrafficMix").Connect((p, mix) =>
  withSim(p, (s) => s.setTrafficMix(mix)));

Remotes.Server.Get("sandboxSpawnBurst").Connect((p, payload) =>
  withSim(p, (s) => s.spawnBurst(payload.type, payload.count)));

Remotes.Server.Get("sandboxToggleUpkeep").Connect((p, enabled) =>
  withSim(p, (s) => s.setUpkeepEnabled(enabled)));

Remotes.Server.Get("retrySameArchitecture").Connect((p) =>
  withSim(p, (s) => s.retrySameArchitecture()));

Remotes.Server.Get("restartSession").Connect((p) =>
  withSim(p, (s) => s.restart()));

Remotes.Server.Get("tutorialAction").Connect((p, payload) =>
  withSim(p, (s) => s.onTutorialAction(payload.action, payload.data)));

Remotes.Server.Get("saveSlotWrite").Connect((p, payload) =>
  withSim(p, (s) => s.saveToSlot(payload.slot)));

print("[Game Server] Ready");
