// SimulationSystem.ts  –  Game Place server
// Server-authoritative simulation loop.
// Mirrors the game loop in game.js, driven by RunService.Heartbeat.

import { RunService } from "@rbxts/services";
import Remotes from "@server-defend/shared/net/Definitions";
import {
  SURVIVAL_CONFIG,
  SANDBOX_CONFIG,
  GRID_CONFIG,
} from "@server-defend/shared/config/GameConfig";
import { randomId } from "@server-defend/shared/util/MathUtil";
import { RoutingSystem } from "./RoutingSystem";
import { EconomySystem } from "./EconomySystem";
import type {
  GameMode,
  ToolType,
  TrafficType,
  GameSnapshot,
  ServiceSnapshot,
  ConnectionSnapshot,
  RequestSnapshot,
  ScoreState,
  FailuresState,
  InterventionState,
  WarningMessage,
  ActiveEventState,
  TrafficDistribution,
  TrafficDistributionPercent,
  Vector3Like,
  SavePayload,
} from "@server-defend/shared/types/GameTypes";
import type { PlayerProfile } from "../persistence/ProfileService";
import { calculateTargetRPS } from "@server-defend/shared/util/MathUtil";

const SNAPSHOT_RATE = 0.1; // seconds between full snapshots

export interface ServiceState extends ServiceSnapshot {
  // Mutable server-side extras
  idleTime: number;
  modelHealth: number;  // MLOps: 0–100
  coldStartPenalty: number;
}

export interface RequestState {
  id: string;
  type: TrafficType;
  position: [number, number, number];
  currentNodeId: string | undefined;
  path: string[];
  cached: boolean;
  failed: boolean;
  throttled: boolean;
  startTime: number;
  processingTime: number;
  timer: number;
}

export class SimulationSystem {
  private player: Player;
  private profile: PlayerProfile;
  private conn: RBXScriptConnection | undefined;

  // ── Game state ──────────────────────────────────────────────────────────

  mode: GameMode;
  activeTool: ToolType = "select";
  money = 0;
  reputation = 100;
  score: ScoreState = { total: 0, storage: 0, database: 0, maliciousBlocked: 0 };
  failures: FailuresState = { STATIC: 0, READ: 0, WRITE: 0, UPLOAD: 0, SEARCH: 0, MALICIOUS: 0 };

  services: ServiceState[] = [];
  connections: ConnectionSnapshot[] = [];
  requests: RequestState[] = [];
  internetConnections: string[] = [];

  trafficDistribution: TrafficDistribution;
  sandboxBudget = SANDBOX_CONFIG.defaultBudget;
  upkeepEnabled = true;
  autoRepairEnabled = false;
  burstCount = SANDBOX_CONFIG.defaultBurstCount;

  isRunning = false;
  gameStarted = false;
  elapsedGameTime = 0;
  currentRPS = 1.0;
  timeScale: 0 | 1 | 3 = 1;
  spawnTimer = 0;
  maliciousSpikeActive = false;
  maliciousSpikeTimer = 0;

  intervention: InterventionState = {
    trafficShiftTimer: 0,
    trafficShiftActive: false,
    currentShift: undefined,
    originalTrafficDist: undefined,
    randomEventTimer: 0,
    activeEvent: undefined,
    eventEndTime: 0,
    eventDuration: 0,
    currentMilestoneIndex: 0,
    rpsMultiplier: 1.0,
    recentEvents: [],
    warnings: [],
    costMultiplier: 1.0,
    trafficBurstMultiplier: 1.0,
  };

  // Previous architecture (for retry)
  private savedArchitecture: Array<{
    type: string;
    position: [number, number, number];
    tier: number;
    connections: string[];
  }> = [];

  private snapshotTimer = 0;
  private routing: RoutingSystem;
  private economy: EconomySystem;

  constructor(player: Player, mode: GameMode, profile: PlayerProfile) {
    this.player = player;
    this.profile = profile;
    this.mode = mode;
    this.trafficDistribution = { ...SURVIVAL_CONFIG.trafficDistribution };
    this.routing = new RoutingSystem(this);
    this.economy = new EconomySystem(this);

    this.initForMode(mode);
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  start(): void {
    this.isRunning = true;
    this.gameStarted = true;
    this.conn = RunService.Heartbeat.Connect((dt) => this.tick(dt));
    Remotes.Server.Get("sessionReady").SendToPlayer(this.player);
  }

  stop(): void {
    this.isRunning = false;
    if (this.conn) {
      this.conn.Disconnect();
      this.conn = undefined;
    }
  }

  // ── Per-frame tick ───────────────────────────────────────────────────────

  private tick(dt: number): void {
    if (!this.isRunning) return;

    const scaled = dt * this.timeScale;
    if (scaled === 0) return; // paused

    this.elapsedGameTime += scaled;

    // Spawn requests
    this.spawnTimer -= scaled;
    while (this.spawnTimer <= 0) {
      this.spawnRequest();
      this.spawnTimer += 1 / this.currentRPS;
    }

    // Process requests
    this.routing.update(scaled);

    // Economy (upkeep, degradation, auto-repair)
    this.economy.update(scaled);

    // Intervention mechanics (malicious spike, traffic shift, random events)
    this.updateInterventionMechanics(scaled);

    // Failure check
    if (this.reputation <= 0) {
      this.triggerGameOver("Reputation Depleted", "Server reputation fell to zero.");
      return;
    }
    if (this.money < 0 && this.mode !== "sandbox") {
      this.triggerGameOver("Bankrupt", "You ran out of budget.");
      return;
    }

    // Snapshot push
    this.snapshotTimer -= dt;
    if (this.snapshotTimer <= 0) {
      this.snapshotTimer = SNAPSHOT_RATE;
      this.pushSnapshot();
    }
  }

  // ── Request spawning ─────────────────────────────────────────────────────

  private spawnRequest(): void {
    const type = this.pickTrafficType();
    const startX = GRID_CONFIG.internetNodeStartPos.x;
    const req: RequestState = {
      id: randomId("req"),
      type,
      position: [startX, 0, 0],
      currentNodeId: "internet",
      path: [],
      cached: false,
      failed: false,
      throttled: false,
      startTime: os.clock(),
      processingTime: 0,
      timer: 0,
    };
    this.requests.push(req);
  }

  private pickTrafficType(): TrafficType {
    const dist = this.trafficDistribution;
    const keys = Object.keys(dist) as TrafficType[];
    const totalWeight = keys.reduce((s, k) => s + dist[k], 0);
    let r = math.random() * totalWeight;
    for (const k of keys) {
      r -= dist[k];
      if (r <= 0) return k;
    }
    return "STATIC";
  }

  // ── Intervention mechanics ───────────────────────────────────────────────

  private updateInterventionMechanics(dt: number): void {
    const cfg = SURVIVAL_CONFIG;
    if (this.mode === "sandbox") return;

    // RPS scaling
    this.currentRPS = calculateTargetRPS(this.elapsedGameTime, cfg.baseRPS)
      * this.intervention.rpsMultiplier
      * this.intervention.trafficBurstMultiplier;

    // Malicious spike
    if (cfg.maliciousSpike.enabled) {
      this.maliciousSpikeTimer += dt;
      if (!this.maliciousSpikeActive && this.maliciousSpikeTimer >= cfg.maliciousSpike.interval) {
        this.activateMaliciousSpike();
      }
      if (this.maliciousSpikeActive && this.maliciousSpikeTimer >= cfg.maliciousSpike.duration) {
        this.deactivateMaliciousSpike();
      }
    }

    // Traffic shift
    if (cfg.trafficShift.enabled) {
      this.intervention.trafficShiftTimer += dt;
      if (!this.intervention.trafficShiftActive &&
        this.intervention.trafficShiftTimer >= cfg.trafficShift.interval) {
        this.activateTrafficShift();
      }
      if (this.intervention.trafficShiftActive &&
        this.intervention.trafficShiftTimer >= cfg.trafficShift.duration) {
        this.deactivateTrafficShift();
      }
    }

    // Random events
    if (cfg.randomEvents.enabled) {
      this.intervention.randomEventTimer += dt;
      if (this.intervention.activeEvent !== undefined) {
        const remaining = this.intervention.eventEndTime - os.clock() * 1000;
        if (remaining <= 0) {
          this.endRandomEvent();
        }
      } else if (this.intervention.randomEventTimer >= cfg.randomEvents.checkInterval) {
        this.intervention.randomEventTimer = 0;
        if (math.random() < 0.5) {
          this.triggerRandomEvent();
        }
      }
    }

    // RPS milestones
    const milestones = cfg.rpsAcceleration.milestones;
    const mi = this.intervention.currentMilestoneIndex;
    if (mi < milestones.size() && this.elapsedGameTime >= milestones[mi].time) {
      this.intervention.rpsMultiplier = milestones[mi].multiplier;
      this.intervention.currentMilestoneIndex = mi + 1;
    }
  }

  private activateMaliciousSpike(): void {
    this.maliciousSpikeActive = true;
    this.maliciousSpikeTimer = 0;
    const cfg = SURVIVAL_CONFIG.maliciousSpike;
    const original = { ...this.trafficDistribution };
    for (const k of Object.keys(original) as TrafficType[]) {
      original[k] *= 1 - cfg.maliciousPercent;
    }
    original.MALICIOUS = cfg.maliciousPercent;
    this.trafficDistribution = original;
    this.addWarning("⚠ MALICIOUS SPIKE – DDoS incoming!", "danger");
    Remotes.Server.Get("interventionWarning").SendToPlayer(this.player, {
      id: randomId("w"),
      text: "DDoS attack wave incoming!",
      level: "danger",
      expiresAt: (os.clock() + 5) * 1000,
    });
  }

  private deactivateMaliciousSpike(): void {
    this.maliciousSpikeActive = false;
    this.maliciousSpikeTimer = 0;
    this.trafficDistribution = { ...SURVIVAL_CONFIG.trafficDistribution };
  }

  private activateTrafficShift(): void {
    const shifts = SURVIVAL_CONFIG.trafficShift.shifts;
    const shift = shifts[math.floor(math.random() * shifts.size())];
    this.intervention.trafficShiftActive = true;
    this.intervention.trafficShiftTimer = 0;
    this.intervention.currentShift = shift.name;
    this.intervention.originalTrafficDist = { ...this.trafficDistribution };
    this.trafficDistribution = { ...shift.distribution };
    this.addWarning(`📊 TRAFFIC SHIFT: ${shift.name}`, "warning");
  }

  private deactivateTrafficShift(): void {
    this.intervention.trafficShiftActive = false;
    this.intervention.trafficShiftTimer = 0;
    if (this.intervention.originalTrafficDist) {
      this.trafficDistribution = this.intervention.originalTrafficDist;
    }
    this.intervention.currentShift = undefined;
  }

  private triggerRandomEvent(): void {
    const events = SURVIVAL_CONFIG.randomEvents.events;
    const ev = events[math.floor(math.random() * events.size())];

    this.intervention.activeEvent = ev.type;
    this.intervention.eventEndTime = os.clock() * 1000 + ev.duration * 1000;
    this.intervention.eventDuration = ev.duration * 1000;

    if (ev.type === "COST_SPIKE") {
      this.intervention.costMultiplier = (ev as { multiplier: number }).multiplier ?? 3.0;
    } else if (ev.type === "CAPACITY_DROP") {
      // Applied by EconomySystem via costMultiplier on capacity
    } else if (ev.type === "TRAFFIC_BURST") {
      this.intervention.trafficBurstMultiplier = (ev as { rpsMultiplier: number }).rpsMultiplier ?? 4.0;
    } else if (ev.type === "SERVICE_OUTAGE") {
      if (this.services.size() > 0) {
        const target = this.services[math.floor(math.random() * this.services.size())];
        target.health = 0;
      }
    }

    this.addWarning(`⚡ EVENT: ${ev.name} – ${ev.description}`, "danger");
    Remotes.Server.Get("activeEventChanged").SendToPlayer(this.player, {
      type: ev.type,
      remainingMs: ev.duration * 1000,
      durationMs: ev.duration * 1000,
    });
  }

  private endRandomEvent(): void {
    this.intervention.costMultiplier = 1.0;
    this.intervention.trafficBurstMultiplier = 1.0;
    this.intervention.activeEvent = undefined;
    Remotes.Server.Get("activeEventChanged").SendToPlayer(this.player, undefined);
  }

  private addWarning(text: string, level: WarningMessage["level"]): void {
    const w: WarningMessage = {
      id: randomId("w"),
      text,
      level,
      expiresAt: (os.clock() + 6) * 1000,
    };
    this.intervention.warnings = [...this.intervention.warnings, w];
  }

  // ── Game over ────────────────────────────────────────────────────────────

  private triggerGameOver(reason: string, desc: string): void {
    this.stop();
    const tips = this.buildTips();
    Remotes.Server.Get("gameOver").SendToPlayer(this.player, {
      reason,
      description: desc,
      tips,
      score: { ...this.score },
      elapsedGameTime: this.elapsedGameTime,
    });

    // Update profile stats
    const stats = this.profile.data.stats;
    if (this.score.total > stats.highScore) stats.highScore = this.score.total;
    if (this.elapsedGameTime > stats.longestRunSec) stats.longestRunSec = this.elapsedGameTime;
    stats.totalRuns += 1;
  }

  private buildTips(): string[] {
    const tips: string[] = [];
    if (this.failures.MALICIOUS > this.score.maliciousBlocked) {
      tips.push("Add a Firewall between the Internet and your Load Balancer.");
    }
    if (this.money < 0) {
      tips.push("Monitor upkeep costs in the Finances panel. Delete unused services.");
    }
    const hasLB = this.services.some((s) => s.type === "alb");
    if (!hasLB) tips.push("A Load Balancer helps distribute traffic across multiple Compute nodes.");
    return tips;
  }

  // ── Snapshot ─────────────────────────────────────────────────────────────

  private pushSnapshot(): void {
    const snapshot = this.buildSnapshot();
    Remotes.Server.Get("stateSnapshot").SendToPlayer(this.player, snapshot);
  }

  buildSnapshot(): GameSnapshot {
    let activeEventState: ActiveEventState | undefined;
    if (this.intervention.activeEvent !== undefined) {
      const remaining = math.max(0, this.intervention.eventEndTime - os.clock() * 1000);
      activeEventState = {
        type: this.intervention.activeEvent,
        remainingMs: remaining,
        durationMs: this.intervention.eventDuration,
      };
    }

    return {
      money: this.money,
      reputation: this.reputation,
      currentRPS: this.currentRPS,
      elapsedGameTime: this.elapsedGameTime,
      timeScale: this.timeScale,
      gameMode: this.mode,
      activeTool: this.activeTool,
      score: { ...this.score },
      failures: { ...this.failures },
      services: this.services.map((s) => ({
        id: s.id,
        type: s.type,
        position: s.position,
        connections: [...s.connections],
        tier: s.tier,
        health: s.health,
        queueLength: s.queueLength,
        processingCount: s.processingCount,
        cacheHitRate: s.cacheHitRate,
        modelHealth: s.modelHealth,
        isCold: s.isCold,
      })),
      connections: [...this.connections],
      requests: this.requests.map((r) => ({
        id: r.id,
        type: r.type,
        position: r.position,
        cached: r.cached,
        failed: r.failed,
        throttled: r.throttled,
      })),
      internetConnections: [...this.internetConnections],
      trafficDistribution: { ...this.trafficDistribution },
      sandboxBudget: this.sandboxBudget,
      upkeepEnabled: this.upkeepEnabled,
      autoRepairEnabled: this.autoRepairEnabled,
      burstCount: this.burstCount,
      isRunning: this.isRunning,
      gameStarted: this.gameStarted,
      activeEvent: activeEventState,
      maliciousSpikeActive: this.maliciousSpikeActive,
    };
  }

  // ── Public API (called by bootstrap) ─────────────────────────────────────

  setMode(mode: GameMode): void {
    this.mode = mode;
    this.initForMode(mode);
    this.restart();
  }

  setTimeScale(scale: 0 | 1 | 3): void {
    this.timeScale = scale;
  }

  setTool(tool: ToolType): void {
    this.activeTool = tool;
  }

  repairService(serviceId: string): void {
    const svc = this.services.find((s) => s.id === serviceId);
    if (!svc) return;
    const cfg = SURVIVAL_CONFIG.degradation;
    const cost = this.getServiceBaseCost(svc.type) * cfg.repairCostPercent;
    if (this.money >= cost) {
      this.money -= cost;
      svc.health = 100;
    }
  }

  setAutoRepair(enabled: boolean): void {
    this.autoRepairEnabled = enabled;
  }

  setSandboxBudget(v: number): void {
    this.sandboxBudget = v;
    this.money = v;
  }

  setSandboxRPS(v: number): void {
    this.currentRPS = v;
  }

  setTrafficMix(mix: TrafficDistributionPercent): void {
    const total = Object.values(mix).reduce((s, v) => s + v, 0);
    if (total === 0) return;
    for (const k of Object.keys(mix) as (keyof TrafficDistributionPercent)[]) {
      this.trafficDistribution[k as keyof TrafficDistribution] = mix[k] / total;
    }
  }

  spawnBurst(type: TrafficType, count: number): void {
    for (let i = 0; i < count; i++) {
      const req: RequestState = {
        id: randomId("burst"),
        type,
        position: [GRID_CONFIG.internetNodeStartPos.x, 0, 0],
        currentNodeId: "internet",
        path: [],
        cached: false,
        failed: false,
        throttled: false,
        startTime: os.clock(),
        processingTime: 0,
        timer: 0,
      };
      this.requests.push(req);
    }
  }

  setUpkeepEnabled(enabled: boolean): void {
    this.upkeepEnabled = enabled;
  }

  retrySameArchitecture(): void {
    const arch = this.savedArchitecture;
    this.restart();
    // Re-place all services
    for (const entry of arch) {
      const id = randomId(entry.type);
      const svc: ServiceState = {
        id,
        type: entry.type as never,
        position: entry.position,
        connections: [],
        tier: entry.tier,
        health: 100,
        queueLength: 0,
        processingCount: 0,
        idleTime: 0,
        modelHealth: 100,
        coldStartPenalty: 0,
        isCold: false,
        cacheHitRate: undefined,
      };
      this.services.push(svc);
    }
    for (const entry of arch) {
      const fromSvc = this.services.find((s) => s.tier === entry.tier && s.type === (entry.type as never));
      if (fromSvc) {
        for (const toId of entry.connections) {
          this.connections.push({ from: fromSvc.id, to: toId });
          fromSvc.connections.push(toId);
        }
      }
    }
  }

  restart(): void {
    // Save architecture before clearing
    this.savedArchitecture = this.services.map((s) => ({
      type: s.type,
      position: [...s.position] as [number, number, number],
      tier: s.tier,
      connections: [...s.connections],
    }));
    this.clearState();
    this.initForMode(this.mode);
    if (!this.conn) this.start();
  }

  onTutorialAction(action: string, _data?: unknown): void {
    if (action === "skip") {
      this.profile.data.tutorial.classicComplete = true;
      Remotes.Server.Get("tutorialState").SendToPlayer(this.player, undefined);
    } else if (action === "next") {
      // Tutorial step management lives in TutorialSystem (extend as needed)
    }
  }

  saveToSlot(slot: string): void {
    const snapshot = this.buildSnapshot();
    const save: SavePayload = {
      timestamp: os.time(),
      version: "1.0.0",
      gameMode: this.mode,
      money: this.money,
      reputation: this.reputation,
      score: { ...this.score },
      trafficDistribution: { ...this.trafficDistribution },
      services: this.services.map((s) => ({
        id: s.id,
        type: s.type,
        position: [...s.position] as [number, number, number],
        connections: [...s.connections],
        tier: s.tier,
        cacheHitRate: s.cacheHitRate,
        modelHealth: s.modelHealth,
        isCold: s.isCold ?? false,
        idleTime: s.idleTime,
      })),
      connections: [...this.connections],
      internetConnections: [...this.internetConnections],
      elapsedGameTime: this.elapsedGameTime,
      currentRPS: this.currentRPS,
      sandboxBudget: this.sandboxBudget,
      upkeepEnabled: this.upkeepEnabled,
      burstCount: this.burstCount,
    };
    this.profile.data.saves[slot] = save;
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private initForMode(mode: GameMode): void {
    this.mode = mode;
    if (mode === "sandbox") {
      this.money = this.sandboxBudget;
      this.upkeepEnabled = SANDBOX_CONFIG.upkeepEnabled;
      this.currentRPS = SANDBOX_CONFIG.defaultRPS;
      for (const [k, v] of Object.entries(SANDBOX_CONFIG.trafficDistribution)) {
        (this.trafficDistribution as Record<string, number>)[k] = v / 100;
      }
    } else {
      this.money = SURVIVAL_CONFIG.startBudget;
      this.upkeepEnabled = true;
      this.currentRPS = SURVIVAL_CONFIG.baseRPS;
      this.trafficDistribution = { ...SURVIVAL_CONFIG.trafficDistribution };
    }
    this.reputation = 100;
    this.score = { total: 0, storage: 0, database: 0, maliciousBlocked: 0 };
    this.failures = { STATIC: 0, READ: 0, WRITE: 0, UPLOAD: 0, SEARCH: 0, MALICIOUS: 0 };
  }

  private clearState(): void {
    this.services = [];
    this.connections = [];
    this.requests = [];
    this.internetConnections = [];
    this.elapsedGameTime = 0;
    this.spawnTimer = 0;
    this.maliciousSpikeActive = false;
    this.maliciousSpikeTimer = 0;
    this.intervention = {
      trafficShiftTimer: 0,
      trafficShiftActive: false,
      currentShift: undefined,
      originalTrafficDist: undefined,
      randomEventTimer: 0,
      activeEvent: undefined,
      eventEndTime: 0,
      eventDuration: 0,
      currentMilestoneIndex: 0,
      rpsMultiplier: 1.0,
      recentEvents: [],
      warnings: [],
      costMultiplier: 1.0,
      trafficBurstMultiplier: 1.0,
    };
  }

  private getServiceBaseCost(type: string): number {
    const cfgMap: Record<string, number> = {
      waf: 40, alb: 50, compute: 60, db: 150, s3: 25, cdn: 60,
      cache: 60, sqs: 45, apigw: 70, nosql: 80,
    };
    return cfgMap[type] ?? 50;
  }
}
