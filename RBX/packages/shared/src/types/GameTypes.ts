// ============================================================
// Shared Game Types
// Mirrors the original JavaScript domain model from game.js /
// src/config.js / src/state.js, rewritten as strict TypeScript.
// ============================================================

// --------------- Enumerations --------------------------------

export type TrafficType = "STATIC" | "READ" | "WRITE" | "UPLOAD" | "SEARCH" | "MALICIOUS";

export type ServiceType =
  | "waf"
  | "alb"
  | "compute"
  | "db"
  | "s3"
  | "cache"
  | "sqs"
  | "cdn"
  | "apigw"
  | "nosql";

export type GameMode = "survival" | "sandbox" | "mlops";

export type ToolType =
  | "select"
  | "connect"
  | "delete"
  | "unlink"
  | "waf"
  | "alb"
  | "lambda"
  | "db"
  | "nosql"
  | "s3"
  | "sqs"
  | "cache"
  | "cdn"
  | "apigw";

export type TimeScale = 0 | 1 | 3;

export type EventType = "COST_SPIKE" | "CAPACITY_DROP" | "TRAFFIC_BURST" | "SERVICE_OUTAGE";

export type TrafficShiftName = "API Heavy" | "Storage Surge" | "Search Storm" | "Write Flood";

// --------------- Traffic distribution ------------------------

export interface TrafficDistribution {
  STATIC: number;
  READ: number;
  WRITE: number;
  UPLOAD: number;
  SEARCH: number;
  MALICIOUS: number;
}

export interface TrafficDistributionPercent {
  STATIC: number;   // 0-100
  READ: number;
  WRITE: number;
  UPLOAD: number;
  SEARCH: number;
  MALICIOUS: number;
}

// --------------- Service / Entity ----------------------------

export interface ServiceTier {
  level: number;
  capacity: number;
  cost: number;
  cacheHitRate?: number;
  rateLimit?: number;
}

export interface ServiceConfig {
  name: string;
  cost: number;
  type: ServiceType;
  processingTime: number;
  capacity: number;
  upkeep: number;
  maxQueueSize?: number;
  cacheHitRate?: number;
  rateLimit?: number;
  tiers?: ServiceTier[];
  tooltip?: {
    upkeep: string;
    desc: string;
  };
}

export interface ServiceSnapshot {
  id: string;
  type: ServiceType;
  /** World-space position as [x, y, z] tuple */
  position: [number, number, number];
  connections: string[];
  tier: number;
  health: number;
  queueLength: number;
  processingCount: number;
  cacheHitRate?: number;
  modelHealth?: number;
  isCold?: boolean;
}

export interface ConnectionSnapshot {
  from: string;
  to: string;
}

// --------------- Requests ------------------------------------

export interface RequestSnapshot {
  id: string;
  type: TrafficType;
  /** World-space position as [x, y, z] */
  position: [number, number, number];
  cached: boolean;
  failed: boolean;
  throttled: boolean;
}

// --------------- Score & Finances ----------------------------

export interface ScoreState {
  total: number;
  storage: number;
  database: number;
  maliciousBlocked: number;
}

export interface FailuresState {
  STATIC: number;
  READ: number;
  WRITE: number;
  UPLOAD: number;
  SEARCH: number;
  MALICIOUS: number;
}

export interface FinancesIncome {
  byType: Record<TrafficType | "blocked", number>;
  countByType: Record<TrafficType | "blocked", number>;
  requests: number;
  blocked: number;
  total: number;
}

export interface FinancesExpenses {
  services: number;
  upkeep: number;
  repairs: number;
  autoRepair: number;
  mitigation: number;
  breach: number;
  byService: Record<string, number>;
  countByService: Record<string, number>;
}

export interface FinancesState {
  income: FinancesIncome;
  expenses: FinancesExpenses;
}

// --------------- Intervention --------------------------------

export interface InterventionState {
  trafficShiftTimer: number;
  trafficShiftActive: boolean;
  currentShift: TrafficShiftName | undefined;
  originalTrafficDist: TrafficDistribution | undefined;
  randomEventTimer: number;
  activeEvent: EventType | undefined;
  eventEndTime: number;
  eventDuration: number;
  currentMilestoneIndex: number;
  rpsMultiplier: number;
  recentEvents: string[];
  warnings: WarningMessage[];
  costMultiplier: number;
  trafficBurstMultiplier: number;
}

export interface WarningMessage {
  id: string;
  text: string;
  level: "info" | "warning" | "danger";
  expiresAt: number;
}

export interface ActiveEventState {
  type: EventType;
  remainingMs: number;
  durationMs: number;
}

// --------------- Game snapshot (replicated S→C) --------------

export interface GameSnapshot {
  money: number;
  reputation: number;
  currentRPS: number;
  elapsedGameTime: number;
  timeScale: TimeScale;
  gameMode: GameMode;
  activeTool: ToolType;
  score: ScoreState;
  failures: FailuresState;
  services: ServiceSnapshot[];
  connections: ConnectionSnapshot[];
  requests: RequestSnapshot[];
  internetConnections: string[];
  trafficDistribution: TrafficDistribution;
  sandboxBudget: number;
  upkeepEnabled: boolean;
  autoRepairEnabled: boolean;
  burstCount: number;
  isRunning: boolean;
  gameStarted: boolean;
  finances?: FinancesState;
  intervention?: Partial<InterventionState>;
  activeEvent?: ActiveEventState;
  maliciousSpikeActive: boolean;
}

// --------------- Failure analysis ----------------------------

export interface FailureAnalysisPayload {
  reason: string;
  description: string;
  tips: string[];
  score: ScoreState;
  elapsedGameTime: number;
}

// --------------- Save / Load ---------------------------------

export interface SavePayload {
  timestamp: number;
  version: string;
  gameMode: GameMode;
  money: number;
  reputation: number;
  score: ScoreState;
  trafficDistribution: TrafficDistribution;
  services: Array<{
    id: string;
    type: ServiceType;
    position: [number, number, number];
    connections: string[];
    tier: number;
    cacheHitRate: number | undefined;
    modelHealth: number | undefined;
    isCold: boolean;
    idleTime: number;
  }>;
  connections: ConnectionSnapshot[];
  internetConnections: string[];
  elapsedGameTime: number;
  currentRPS: number;
  sandboxBudget: number;
  upkeepEnabled: boolean;
  burstCount: number;
}

// --------------- Player profile data (DataStore) -------------

export interface SoundCategoryState {
  vol: number;   // 0–1
  on: boolean;
}

export interface SoundCategoryStateMap {
  master: SoundCategoryState;
  bgm: SoundCategoryState;
  ui: SoundCategoryState;
  events: SoundCategoryState;
  gameplay: SoundCategoryState;
}

export interface PlayerProfileData {
  tutorial: {
    classicComplete: boolean;
    mlopsComplete: boolean;
  };
  options: {
    locale: string;
    sound: SoundCategoryStateMap;
  };
  saves: Record<string, SavePayload>;
  stats: {
    highScore: number;
    longestRunSec: number;
    totalRuns: number;
  };
}

// --------------- Tutorial ------------------------------------

export interface TutorialStepState {
  id: string;
  title: string;
  text: string;
  icon: string;
  highlight: string | undefined;
  action: string;
  position?: "center";
  hint?: string;
  stepIndex: number;
  totalSteps: number;
}

// --------------- Misc ----------------------------------------

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export interface ServicePriceMap {
  waf: number;
  alb: number;
  lambda: number;
  db: number;
  nosql: number;
  s3: number;
  sqs: number;
  cache: number;
  cdn: number;
  apigw: number;
}

export interface SandboxState {
  budget: number;
  rps: number;
  trafficMix: TrafficDistributionPercent;
  burstCount: number;
  upkeepEnabled: boolean;
}

export interface TeleportData {
  gameMode: GameMode;
  profileKey: string;
}
