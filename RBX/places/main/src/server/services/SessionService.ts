// SessionService.ts  –  Main Place server
// Handles session initialisation, resume and load,
// ultimately triggering a teleport to the game place.

import type { GameMode, TeleportData } from "@server-defend/shared/types/GameTypes";

export interface SessionInitPayload {
  mode: GameMode;
}

type TeleportFn = (player: Player, data: TeleportData) => void;

/**
 * Called when a player presses Play / starts a new session.
 * Builds a TeleportData payload and hands off to TeleportFlow.
 */
export function handleSessionInit(
  player: Player,
  payload: SessionInitPayload,
  teleport: TeleportFn,
): void {
  print(`[SessionService] ${player.Name} starting mode=${payload.mode}`);
  const data: TeleportData = {
    gameMode: payload.mode,
    profileKey: tostring(player.UserId),
  };
  teleport(player, data);
}

/**
 * Resume: used when a player returns to lobby while a session was
 * still active (edge case – re-teleports with same mode).
 */
export function handleSessionResume(player: Player): void {
  print(`[SessionService] ${player.Name} resuming`);
  // TODO: restore pending session data from DataStore if needed
}

/**
 * Load a named save slot and teleport to game with that data.
 */
export function handleSessionLoad(player: Player, slot: string): void {
  print(`[SessionService] ${player.Name} loading slot=${slot}`);
  // TODO: read save from ProfileStore and embed in TeleportData
}
