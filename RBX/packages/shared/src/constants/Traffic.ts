// Traffic.ts  –  runtime traffic-type constants

export const TRAFFIC_TYPES_LIST = [
  "STATIC",
  "READ",
  "WRITE",
  "UPLOAD",
  "SEARCH",
  "MALICIOUS",
] as const;

export type TrafficTypeKey = (typeof TRAFFIC_TYPES_LIST)[number];

export const SERVICE_TYPES_LIST = [
  "waf",
  "alb",
  "compute",
  "db",
  "s3",
  "cache",
  "sqs",
  "cdn",
  "apigw",
  "nosql",
] as const;

export type ServiceTypeKey = (typeof SERVICE_TYPES_LIST)[number];

export const UPGRADEABLE_SERVICE_TYPES: ServiceTypeKey[] = [
  "compute",
  "db",
  "cache",
  "apigw",
  "nosql",
];

export const TOOL_TO_SERVICE_TYPE: Record<string, ServiceTypeKey> = {
  waf: "waf",
  alb: "alb",
  lambda: "compute",
  db: "db",
  nosql: "nosql",
  s3: "s3",
  sqs: "sqs",
  cache: "cache",
  cdn: "cdn",
  apigw: "apigw",
};

export const DEPLOY_TOOLS = [
  "waf",
  "alb",
  "lambda",
  "db",
  "nosql",
  "s3",
  "sqs",
  "cache",
  "cdn",
  "apigw",
] as const;
