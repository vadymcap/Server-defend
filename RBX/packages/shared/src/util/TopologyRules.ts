// TopologyRules.ts
// Mirrors _canConnect() from game.js / game-patch section.
// Used by server BuildSystem and client for UI feedback.

import type { ServiceType } from "../types/GameTypes";

type NodeType = ServiceType | "internet";

/**
 * Returns true if a directional connection from → to is allowed.
 * Mirrors the _canConnect() logic in the original game-patch.
 */
export function canConnect(fromType: NodeType, toType: NodeType): boolean {
  if (fromType === toType && fromType !== "internet") return false;

  switch (fromType) {
    case "internet":
      return ["waf", "alb", "cdn", "apigw"].includes(toType);
    case "waf":
      return ["alb", "sqs", "apigw"].includes(toType);
    case "sqs":
      return ["alb", "compute"].includes(toType);
    case "alb":
      return ["sqs", "compute"].includes(toType);
    case "compute":
      return ["cache", "db", "s3", "nosql"].includes(toType);
    case "cache":
      return ["db", "s3", "nosql"].includes(toType);
    case "cdn":
      return toType === "s3";
    case "apigw":
      return ["alb", "sqs", "compute"].includes(toType);
    default:
      return false;
  }
}

/**
 * Returns all valid target node-types for a given source node-type.
 */
export function validTargets(fromType: NodeType): NodeType[] {
  const all: NodeType[] = [
    "internet",
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
  ];
  return all.filter((t) => canConnect(fromType, t));
}

/**
 * Checks whether `existingConnections` already contains fromId→toId.
 */
export function connectionExists(
  fromId: string,
  toId: string,
  existingConnections: Array<{ from: string; to: string }>,
): boolean {
  for (const conn of existingConnections) {
    if (conn.from === fromId && conn.to === toId) return true;
  }
  return false;
}
