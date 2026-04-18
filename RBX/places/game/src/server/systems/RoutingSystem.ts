// RoutingSystem.ts  –  Game Place server
// Advances active requests along the topology path, handling:
//   - caching (CDN, Memory Cache)
//   - malicious traffic blocking (WAF)
//   - rate limiting (API Gateway)
//   - queue buffering (SQS)
//   - processing at compute/db/s3/nosql
//   - cold-start penalties (MLOps Inference Endpoint)
//   - reputation/score updates on success/failure

import {
  SURVIVAL_CONFIG,
  SERVICE_CONFIG,
  TRAFFIC_TYPE_CONFIG,
} from "@server-defend/shared/config/GameConfig";
import type { SimulationSystem, RequestState, ServiceState } from "./SimulationSystem";

export class RoutingSystem {
  private sim: SimulationSystem;

  constructor(sim: SimulationSystem) {
    this.sim = sim;
  }

  update(dt: number): void {
    const toRemove: string[] = [];

    for (const req of this.sim.requests) {
      if (req.failed || req.cached) {
        toRemove.push(req.id);
        continue;
      }

      // Advance processing timer
      if (req.processingTime > 0) {
        req.timer += dt;
        if (req.timer >= req.processingTime) {
          this.onProcessingComplete(req);
          toRemove.push(req.id);
        }
        continue;
      }

      // Advance to next node in path
      const nextNodeId = this.getNextNode(req);
      if (nextNodeId === undefined) {
        // No path found – request fails
        this.failRequest(req, "No valid path");
        toRemove.push(req.id);
        continue;
      }

      this.routeToNode(req, nextNodeId, dt);
    }

    // Remove completed / failed requests
    this.sim.requests = this.sim.requests.filter((r) => !toRemove.includes(r.id));
  }

  // ── Routing decision ─────────────────────────────────────────────────────

  private getNextNode(req: RequestState): string | undefined {
    const current = req.currentNodeId;

    // From internet: follow first internet connection
    if (current === "internet") {
      return this.sim.internetConnections[0];
    }

    // Find the service and follow its connections toward valid destination
    const svc = this.getService(current);
    if (!svc) return undefined;

    // Simple greedy: pick first connected node that accepts this traffic type
    for (const connId of svc.connections) {
      const target = this.getService(connId);
      if (target && this.canAccept(target, req.type)) {
        return connId;
      }
    }

    return undefined;
  }

  private canAccept(svc: ServiceState, type: string): boolean {
    // NoSQL cannot handle SEARCH
    if (svc.type === "nosql" && type === "SEARCH") return false;
    // Compute handles everything
    if (svc.type === "compute") return true;
    // DB handles READ/WRITE/SEARCH
    if (svc.type === "db") return ["READ", "WRITE", "SEARCH"].includes(type);
    // NoSQL handles READ/WRITE
    if (svc.type === "nosql") return ["READ", "WRITE"].includes(type);
    // S3 handles STATIC/UPLOAD
    if (svc.type === "s3") return ["STATIC", "UPLOAD"].includes(type);
    // CDN handles STATIC
    if (svc.type === "cdn") return type === "STATIC";
    // Cache acts as a pass-through gateway
    if (svc.type === "cache") return ["READ", "STATIC", "SEARCH"].includes(type);
    // WAF, ALB, SQS, APIGW are routers (accept everything)
    return true;
  }

  private routeToNode(req: RequestState, nodeId: string, _dt: number): void {
    const svc = this.getService(nodeId);
    if (!svc) {
      this.failRequest(req, "Node missing");
      return;
    }

    req.path.push(nodeId);
    req.currentNodeId = nodeId;

    // Update visual position (centred on service position)
    req.position = [...svc.position];

    // ── Node-specific logic ──────────────────────────────────────────────

    if (svc.type === "waf") {
      if (req.type === "MALICIOUS") {
        // Block the attack
        this.sim.score.maliciousBlocked += 1;
        this.sim.score.total += SURVIVAL_CONFIG.SCORE_POINTS.MALICIOUS_BLOCKED_SCORE;
        this.sim.money -= SURVIVAL_CONFIG.SCORE_POINTS.MALICIOUS_MITIGATION_COST;
        req.failed = true;
        return;
      }
      // Pass-through after processing time
      req.processingTime = SERVICE_CONFIG.waf.processingTime / 1000;
      req.timer = 0;
      return;
    }

    if (svc.type === "apigw") {
      const currentCfg = SERVICE_CONFIG.apigw;
      const tierCfg = currentCfg.tiers?.[svc.tier - 1];
      const rateLimit = tierCfg?.rateLimit ?? currentCfg.rateLimit ?? 20;
      if (svc.processingCount >= rateLimit) {
        // Throttle
        req.throttled = true;
        this.sim.reputation += SURVIVAL_CONFIG.SCORE_POINTS.THROTTLED_REPUTATION;
        req.failed = true;
        return;
      }
      svc.processingCount += 1;
      req.processingTime = SERVICE_CONFIG.apigw.processingTime / 1000;
      req.timer = 0;
      return;
    }

    if (svc.type === "sqs") {
      const maxQ = SERVICE_CONFIG.sqs.maxQueueSize ?? 200;
      if (svc.queueLength >= maxQ) {
        this.failRequest(req, "Queue full");
        return;
      }
      svc.queueLength += 1;
      req.processingTime = SERVICE_CONFIG.sqs.processingTime / 1000;
      req.timer = 0;
      return;
    }

    if (svc.type === "alb") {
      // Pure router, minimal delay
      req.processingTime = SERVICE_CONFIG.alb.processingTime / 1000;
      req.timer = 0;
      return;
    }

    if (svc.type === "cdn" || svc.type === "cache") {
      const hitRate = svc.cacheHitRate ?? SERVICE_CONFIG[svc.type].cacheHitRate ?? 0;
      if (math.random() < hitRate) {
        req.cached = true;
        this.succeedRequest(req, svc);
        return;
      }
      // Cache miss – continue routing
      req.processingTime = SERVICE_CONFIG[svc.type].processingTime / 1000;
      req.timer = 0;
      return;
    }

    // Compute / DB / NoSQL / S3 – terminal processing nodes
    const cap = this.getEffectiveCapacity(svc);
    if (svc.processingCount >= cap) {
      this.failRequest(req, "Capacity exceeded");
      return;
    }

    let procTime = SERVICE_CONFIG[svc.type]?.processingTime ?? 500;

    // MLOps cold start penalty
    if (svc.isCold) {
      procTime += 8000;
      svc.isCold = false;
    }

    svc.processingCount += 1;
    svc.idleTime = 0;
    req.processingTime = procTime / 1000;
    req.timer = 0;
  }

  private onProcessingComplete(req: RequestState): void {
    const nodeId = req.currentNodeId;
    if (!nodeId) return;

    const svc = this.getService(nodeId);
    if (svc) {
      if (svc.processingCount > 0) svc.processingCount -= 1;
      if (svc.queueLength > 0 && svc.type === "sqs") svc.queueLength -= 1;
    }

    this.succeedRequest(req, svc);
  }

  private succeedRequest(req: RequestState, _svc: ServiceState | undefined): void {
    const cfg = TRAFFIC_TYPE_CONFIG[req.type];
    if (!cfg) return;

    this.sim.money += cfg.reward;
    this.sim.score.total += cfg.score + (req.cached ? SURVIVAL_CONFIG.SCORE_POINTS.CACHE_HIT_BONUS : 0);
    this.sim.reputation += SURVIVAL_CONFIG.SCORE_POINTS.SUCCESS_REPUTATION;

    if (req.type === "STATIC" || req.type === "UPLOAD") this.sim.score.storage += 1;
    if (req.type === "READ" || req.type === "WRITE" || req.type === "SEARCH")
      this.sim.score.database += 1;
  }

  private failRequest(req: RequestState, _reason: string): void {
    req.failed = true;
    (this.sim.failures as Record<string, number>)[req.type] =
      ((this.sim.failures as Record<string, number>)[req.type] ?? 0) + 1;

    if (req.type === "MALICIOUS") {
      this.sim.reputation += SURVIVAL_CONFIG.SCORE_POINTS.MALICIOUS_PASSED_REPUTATION;
      this.sim.money -= SURVIVAL_CONFIG.SCORE_POINTS.MALICIOUS_BREACH_PENALTY;
    } else {
      this.sim.reputation += SURVIVAL_CONFIG.SCORE_POINTS.FAIL_REPUTATION;
    }
  }

  private getEffectiveCapacity(svc: ServiceState): number {
    const baseCfg = SERVICE_CONFIG[svc.type];
    const tierCap = baseCfg.tiers?.[svc.tier - 1]?.capacity ?? baseCfg.capacity;
    const eventMultiplier = this.sim.intervention.costMultiplier === 3.0 ? 1.0 :
      (this.sim.intervention.activeEvent === "CAPACITY_DROP" ? 0.4 : 1.0);
    return math.floor(tierCap * (svc.health / 100) * eventMultiplier);
  }

  private getService(id: string): ServiceState | undefined {
    return this.sim.services.find((s) => s.id === id);
  }
}
