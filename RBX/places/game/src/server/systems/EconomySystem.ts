// EconomySystem.ts  –  Game Place server
// Handles per-tick upkeep billing, service degradation, auto-repair,
// and cold-start tracking for MLOps mode.

import { SURVIVAL_CONFIG, SERVICE_CONFIG } from "@server-defend/shared/config/GameConfig";
import type { SimulationSystem, ServiceState } from "./SimulationSystem";

const IDLE_COLD_THRESHOLD = 12; // seconds idle before going cold (MLOps)

export class EconomySystem {
  private sim: SimulationSystem;
  private upkeepTimer = 0;

  constructor(sim: SimulationSystem) {
    this.sim = sim;
  }

  update(dt: number): void {
    if (!this.sim.upkeepEnabled) return;

    // Upkeep billing (per second)
    this.upkeepTimer += dt;
    if (this.upkeepTimer >= 1.0) {
      this.upkeepTimer -= 1.0;
      this.billUpkeep();
    }

    // Degradation and auto-repair
    if (SURVIVAL_CONFIG.degradation.enabled) {
      for (const svc of this.sim.services) {
        this.tickDegradation(svc, dt);
      }
    }

    // Idle time / cold-start tracking
    for (const svc of this.sim.services) {
      if (svc.processingCount === 0) {
        svc.idleTime += dt;
        // MLOps cold-start
        if (this.sim.mode === "mlops" && svc.type === "compute") {
          if (svc.idleTime >= IDLE_COLD_THRESHOLD) {
            svc.isCold = true;
          }
        }
      } else {
        svc.idleTime = 0;
      }
    }

    // MLOps model drift
    if (this.sim.mode === "mlops") {
      for (const svc of this.sim.services) {
        if (svc.type === "compute" || svc.type === "nosql") {
          svc.modelHealth = math.max(0, svc.modelHealth - 0.01 * dt);
        }
      }
    }
  }

  private billUpkeep(): void {
    const gameTime = this.sim.elapsedGameTime;
    const scaling = SURVIVAL_CONFIG.upkeepScaling;
    const upkeepMultiplier = math.min(
      scaling.maxMultiplier,
      scaling.baseMultiplier + (gameTime / scaling.scaleTime) * (scaling.maxMultiplier - scaling.baseMultiplier),
    ) * this.sim.intervention.costMultiplier;

    for (const svc of this.sim.services) {
      const baseCfg = SERVICE_CONFIG[svc.type];
      if (!baseCfg) continue;

      let upkeep = baseCfg.upkeep * upkeepMultiplier;

      // Auto-repair extra cost
      if (this.sim.autoRepairEnabled) {
        upkeep *= 1 + SURVIVAL_CONFIG.degradation.autoRepairCostPercent;
      }

      this.sim.money -= upkeep;
    }
  }

  private tickDegradation(svc: ServiceState, dt: number): void {
    const cfg = SURVIVAL_CONFIG.degradation;

    // Health decay (only when processing requests)
    if (svc.processingCount > 0) {
      svc.health = math.max(0, svc.health - cfg.healthDecayRate * dt);
    }

    // Auto-repair (when idle)
    if (this.sim.autoRepairEnabled && svc.processingCount === 0 && svc.health < 100) {
      svc.health = math.min(100, svc.health + cfg.autoRepairRate * dt);
    }
  }
}
