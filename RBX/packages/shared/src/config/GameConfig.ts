// GameConfig.ts
// Direct port of src/config.js – all magic numbers in one place.

import type {
  ServiceConfig,
  TrafficDistribution,
} from "../types/GameTypes";

// --------------- Traffic types ------------------------------

export const TRAFFIC_TYPES = {
  STATIC: "STATIC",
  READ: "READ",
  WRITE: "WRITE",
  UPLOAD: "UPLOAD",
  SEARCH: "SEARCH",
  MALICIOUS: "MALICIOUS",
} as const;

export interface TrafficTypeConfig {
  name: string;
  method: string;
  /** 0xRRGGBB colour (kept for BrickColor / Part Color3 conversion) */
  color: number;
  reward: number;
  score: number;
  cacheable: boolean;
  cacheHitRate: number;
  destination: string;
  processingWeight: number;
}

export const TRAFFIC_TYPE_CONFIG: Record<string, TrafficTypeConfig> = {
  STATIC: {
    name: "STATIC",
    method: "GET",
    color: 0x4ade80,
    reward: 0.5,
    score: 3,
    cacheable: true,
    cacheHitRate: 0.9,
    destination: "cdn",
    processingWeight: 0.5,
  },
  READ: {
    name: "READ",
    method: "GET",
    color: 0x3b82f6,
    reward: 0.8,
    score: 5,
    cacheable: true,
    cacheHitRate: 0.4,
    destination: "db",
    processingWeight: 1.0,
  },
  WRITE: {
    name: "WRITE",
    method: "POST/PUT",
    color: 0xf97316,
    reward: 1.2,
    score: 8,
    cacheable: false,
    cacheHitRate: 0,
    destination: "db",
    processingWeight: 1.5,
  },
  UPLOAD: {
    name: "UPLOAD",
    method: "POST+file",
    color: 0xfbbf24,
    reward: 1.5,
    score: 10,
    cacheable: false,
    cacheHitRate: 0,
    destination: "s3",
    processingWeight: 2.0,
  },
  SEARCH: {
    name: "SEARCH",
    method: "GET+query",
    color: 0x06b6d4,
    reward: 0.8,
    score: 5,
    cacheable: true,
    cacheHitRate: 0.15,
    destination: "db",
    processingWeight: 2.5,
  },
  MALICIOUS: {
    name: "MALICIOUS",
    method: "any",
    color: 0xef4444,
    reward: 0,
    score: 0,
    cacheable: false,
    cacheHitRate: 0,
    destination: "blocked",
    processingWeight: 1.0,
  },
};

// --------------- Services -----------------------------------

export const SERVICE_CONFIG: Record<string, ServiceConfig> = {
  waf: {
    name: "Firewall",
    cost: 40,
    type: "waf",
    processingTime: 20,
    capacity: 30,
    upkeep: 4,
    tooltip: { upkeep: "Low", desc: "<b>Firewall.</b> Blocks Malicious traffic." },
  },
  alb: {
    name: "Load Balancer",
    cost: 50,
    type: "alb",
    processingTime: 50,
    capacity: 20,
    upkeep: 6,
    tooltip: { upkeep: "Medium", desc: "<b>Load Balancer.</b> Distributes traffic." },
  },
  compute: {
    name: "Compute",
    cost: 60,
    type: "compute",
    processingTime: 600,
    capacity: 4,
    upkeep: 12,
    tooltip: { upkeep: "High", desc: "<b>Compute Node.</b> Processes requests. Upgradeable." },
    tiers: [
      { level: 1, capacity: 4, cost: 0 },
      { level: 2, capacity: 10, cost: 100 },
      { level: 3, capacity: 18, cost: 160 },
    ],
  },
  db: {
    name: "Relational DB",
    cost: 150,
    type: "db",
    processingTime: 300,
    capacity: 8,
    upkeep: 24,
    tooltip: { upkeep: "Very High", desc: "<b>SQL DB.</b> READ/WRITE/SEARCH. Upgradeable." },
    tiers: [
      { level: 1, capacity: 8, cost: 0 },
      { level: 2, capacity: 20, cost: 200 },
      { level: 3, capacity: 35, cost: 350 },
    ],
  },
  s3: {
    name: "File Storage",
    cost: 25,
    type: "s3",
    processingTime: 200,
    capacity: 25,
    upkeep: 5,
    tooltip: { upkeep: "Low", desc: "<b>Storage.</b> STATIC/UPLOAD destination." },
  },
  cdn: {
    name: "CDN",
    cost: 60,
    type: "cdn",
    processingTime: 30,
    capacity: 50,
    upkeep: 5,
    cacheHitRate: 0.95,
    tooltip: { upkeep: "Low", desc: "<b>CDN.</b> Caches STATIC content at edge." },
  },
  cache: {
    name: "Memory Cache",
    cost: 60,
    type: "cache",
    processingTime: 50,
    capacity: 30,
    upkeep: 8,
    cacheHitRate: 0.35,
    tooltip: { upkeep: "Medium", desc: "<b>Memory Cache.</b> Reduces DB load. Upgradeable." },
    tiers: [
      { level: 1, capacity: 30, cacheHitRate: 0.35, cost: 0 },
      { level: 2, capacity: 50, cacheHitRate: 0.5, cost: 120 },
      { level: 3, capacity: 80, cacheHitRate: 0.65, cost: 180 },
    ],
  },
  sqs: {
    name: "Message Queue",
    cost: 45,
    type: "sqs",
    processingTime: 20,
    capacity: 50,
    maxQueueSize: 200,
    upkeep: 3,
    tooltip: { upkeep: "Low", desc: "<b>Queue.</b> Buffers during spikes." },
  },
  apigw: {
    name: "API Gateway",
    cost: 70,
    type: "apigw",
    processingTime: 30,
    capacity: 40,
    upkeep: 8,
    rateLimit: 20,
    tooltip: { upkeep: "Medium", desc: "<b>API Gateway.</b> Rate limits traffic. Upgradeable." },
    tiers: [
      { level: 1, capacity: 40, rateLimit: 20, cost: 0 },
      { level: 2, capacity: 60, rateLimit: 40, cost: 120 },
      { level: 3, capacity: 80, rateLimit: 80, cost: 200 },
    ],
  },
  nosql: {
    name: "NoSQL DB",
    cost: 80,
    type: "nosql",
    processingTime: 150,
    capacity: 15,
    upkeep: 14,
    tooltip: { upkeep: "High", desc: "<b>NoSQL DB.</b> Fast READ/WRITE. No SEARCH. Upgradeable." },
    tiers: [
      { level: 1, capacity: 15, cost: 0 },
      { level: 2, capacity: 30, cost: 120 },
      { level: 3, capacity: 50, cost: 200 },
    ],
  },
};

// --------------- Survival config ----------------------------

export const SURVIVAL_CONFIG = {
  startBudget: 420,
  baseRPS: 1.0,
  rampUp: 0.025,
  maxRPS: math.huge,
  trafficDistribution: {
    STATIC: 0.3,
    READ: 0.2,
    WRITE: 0.15,
    UPLOAD: 0.05,
    SEARCH: 0.1,
    MALICIOUS: 0.2,
  } as TrafficDistribution,

  SCORE_POINTS: {
    SUCCESS_REPUTATION: 0.1,
    FAIL_REPUTATION: -1,
    MALICIOUS_PASSED_REPUTATION: -5,
    MALICIOUS_BLOCKED_SCORE: 10,
    CACHE_HIT_BONUS: 0.2,
    MALICIOUS_MITIGATION_COST: 1.0,
    MALICIOUS_BREACH_PENALTY: 50.0,
    THROTTLED_REPUTATION: -0.2,
  },

  upkeepScaling: {
    enabled: true,
    baseMultiplier: 1.0,
    maxMultiplier: 2.0,
    scaleTime: 600,
  },

  maliciousSpike: {
    enabled: true,
    interval: 45,
    duration: 12,
    maliciousPercent: 0.5,
    warningTime: 3,
  },

  degradation: {
    enabled: true,
    healthDecayRate: 0.4,
    criticalHealth: 40,
    repairCostPercent: 0.15,
    autoRepairEnabled: false,
    autoRepairCostPercent: 0.1,
    autoRepairRate: 2,
  },

  trafficShift: {
    enabled: true,
    interval: 40,
    duration: 25,
    warningTime: 3,
    shifts: [
      {
        name: "API Heavy" as const,
        distribution: { STATIC: 0.1, READ: 0.35, WRITE: 0.25, UPLOAD: 0.05, SEARCH: 0.15, MALICIOUS: 0.1 } as TrafficDistribution,
      },
      {
        name: "Storage Surge" as const,
        distribution: { STATIC: 0.45, READ: 0.1, WRITE: 0.1, UPLOAD: 0.2, SEARCH: 0.05, MALICIOUS: 0.1 } as TrafficDistribution,
      },
      {
        name: "Search Storm" as const,
        distribution: { STATIC: 0.15, READ: 0.15, WRITE: 0.1, UPLOAD: 0.05, SEARCH: 0.4, MALICIOUS: 0.15 } as TrafficDistribution,
      },
      {
        name: "Write Flood" as const,
        distribution: { STATIC: 0.1, READ: 0.1, WRITE: 0.45, UPLOAD: 0.1, SEARCH: 0.1, MALICIOUS: 0.15 } as TrafficDistribution,
      },
    ],
  },

  randomEvents: {
    enabled: true,
    minInterval: 15,
    maxInterval: 45,
    checkInterval: 30,
    types: ["COST_SPIKE", "CAPACITY_DROP", "TRAFFIC_BURST", "SERVICE_OUTAGE"] as const,
    events: [
      { type: "COST_SPIKE" as const, name: "Cloud Price Surge", duration: 20, multiplier: 3.0, description: "Upkeep costs tripled!" },
      { type: "CAPACITY_DROP" as const, name: "Service Degradation", duration: 15, multiplier: 0.4, description: "All capacities reduced 60%!" },
      { type: "TRAFFIC_BURST" as const, name: "Viral Traffic", duration: 12, rpsMultiplier: 4.0, description: "Traffic 4x!" },
      { type: "SERVICE_OUTAGE" as const, name: "Service Outage", duration: 15, description: "Random service goes offline!" },
    ],
  },

  rpsAcceleration: {
    enabled: true,
    milestones: [
      { time: 60, multiplier: 1.3 },
      { time: 120, multiplier: 1.6 },
      { time: 180, multiplier: 2.0 },
      { time: 300, multiplier: 2.5 },
      { time: 420, multiplier: 3.0 },
      { time: 600, multiplier: 4.0 },
    ],
  },
};

// --------------- Sandbox config ----------------------------

export const SANDBOX_CONFIG = {
  defaultBudget: 2000,
  defaultRPS: 1.0,
  defaultBurstCount: 10,
  upkeepEnabled: false,
  trafficDistribution: {
    STATIC: 30,
    READ: 20,
    WRITE: 15,
    UPLOAD: 5,
    SEARCH: 10,
    MALICIOUS: 20,
  },
};

// --------------- Grid config --------------------------------

export const GRID_CONFIG = {
  gridSize: 30,
  tileSize: 4,
  internetNodeStartPos: { x: -40, y: 0, z: 0 },
} as const;

// --------------- Helpers ------------------------------------

export function getServiceConfig(type: string): ServiceConfig {
  const cfg = SERVICE_CONFIG[type];
  if (cfg === undefined) error(`Unknown service type: ${type}`);
  return cfg;
}

export function getTrafficTypeConfig(type: string): TrafficTypeConfig {
  const cfg = TRAFFIC_TYPE_CONFIG[type];
  if (cfg === undefined) error(`Unknown traffic type: ${type}`);
  return cfg;
}
