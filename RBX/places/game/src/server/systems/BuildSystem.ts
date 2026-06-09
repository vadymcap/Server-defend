// BuildSystem.ts  –  Game Place server
// Handles player build actions: place, upgrade, delete, connect, unlink, move.
// Enforces topology rules before applying mutations to SimulationSystem state.

import { canConnect, connectionExists } from "@server-defend/shared/util/TopologyRules";
import { snapToGrid } from "@server-defend/shared/util/MathUtil";
import { SERVICE_CONFIG, GRID_CONFIG } from "@server-defend/shared/config/GameConfig";
import { randomId } from "@server-defend/shared/util/MathUtil";
import type { SimulationSystem, ServiceState } from "./SimulationSystem";
import type { ServiceType, Vector3Like } from "@server-defend/shared/types/GameTypes";

export namespace BuildSystem {
  export function placeService(
    sim: SimulationSystem,
    type: ServiceType,
    pos: Vector3Like,
  ): boolean {
    const cfg = SERVICE_CONFIG[type];
    if (!cfg) return false;

    // Check budget
    if (sim.money < cfg.cost) return false;

    // Snap to grid
    const snapped: [number, number, number] = [
      snapToGrid(pos.x, GRID_CONFIG.tileSize),
      0,
      snapToGrid(pos.z, GRID_CONFIG.tileSize),
    ];

    // Check no overlap with existing service
    for (const svc of sim.services) {
      if (svc.position[0] === snapped[0] && svc.position[2] === snapped[2]) {
        return false;
      }
    }

    const svc: ServiceState = {
      id: randomId(type),
      type,
      position: snapped,
      connections: [],
      tier: 1,
      health: 100,
      queueLength: 0,
      processingCount: 0,
      idleTime: 0,
      modelHealth: 100,
      coldStartPenalty: 0,
      isCold: false,
      cacheHitRate: cfg.cacheHitRate,
    };

    sim.services.push(svc);
    sim.money -= cfg.cost;
    return true;
  }

  export function upgradeService(sim: SimulationSystem, serviceId: string): boolean {
    const svc = sim.services.find((s) => s.id === serviceId);
    if (!svc) return false;

    const cfg = SERVICE_CONFIG[svc.type];
    if (!cfg?.tiers) return false;

    const nextTier = svc.tier + 1;
    const tierCfg = cfg.tiers[nextTier - 1];
    if (!tierCfg) return false;

    if (sim.money < tierCfg.cost) return false;

    sim.money -= tierCfg.cost;
    svc.tier = nextTier;
    if (tierCfg.cacheHitRate !== undefined) svc.cacheHitRate = tierCfg.cacheHitRate;
    return true;
  }

  export function deleteService(sim: SimulationSystem, serviceId: string): boolean {
    const idx = sim.services.findIndex((s) => s.id === serviceId);
    if (idx === -1) return false;

    sim.services.splice(idx, 1);

    // Remove all connections involving this service
    sim.connections = sim.connections.filter(
      (c) => c.from !== serviceId && c.to !== serviceId,
    );

    // Remove from other services' connections arrays
    for (const svc of sim.services) {
      svc.connections = svc.connections.filter((id) => id !== serviceId);
    }

    // Remove from internet connections
    sim.internetConnections = sim.internetConnections.filter((id) => id !== serviceId);

    return true;
  }

  export function connectServices(
    sim: SimulationSystem,
    fromId: string,
    toId: string,
  ): boolean {
    // Resolve from-node type
    let fromType: string;
    if (fromId === "internet") {
      fromType = "internet";
    } else {
      const from = sim.services.find((s) => s.id === fromId);
      if (!from) return false;
      fromType = from.type;
    }

    const to = sim.services.find((s) => s.id === toId);
    if (!to) return false;

    if (!canConnect(fromType as never, to.type)) return false;

    if (connectionExists(fromId, toId, sim.connections)) return false;

    sim.connections.push({ from: fromId, to: toId });

    if (fromId === "internet") {
      sim.internetConnections.push(toId);
    } else {
      const from = sim.services.find((s) => s.id === fromId);
      if (from) from.connections.push(toId);
    }

    return true;
  }

  export function unlinkServices(
    sim: SimulationSystem,
    fromId: string,
    toId: string,
  ): boolean {
    const before = sim.connections.size();
    sim.connections = sim.connections.filter(
      (c) => !(c.from === fromId && c.to === toId),
    );

    if (fromId === "internet") {
      sim.internetConnections = sim.internetConnections.filter((id) => id !== toId);
    } else {
      const from = sim.services.find((s) => s.id === fromId);
      if (from) from.connections = from.connections.filter((id) => id !== toId);
    }

    return sim.connections.size() < before;
  }

  export function moveNodes(
    sim: SimulationSystem,
    ids: string[],
    positions: Record<string, Vector3Like>,
  ): void {
    for (const id of ids) {
      const svc = sim.services.find((s) => s.id === id);
      if (!svc) continue;
      const pos = positions[id];
      if (!pos) continue;
      svc.position = [
        snapToGrid(pos.x, GRID_CONFIG.tileSize),
        0,
        snapToGrid(pos.z, GRID_CONFIG.tileSize),
      ];
    }
  }
}
