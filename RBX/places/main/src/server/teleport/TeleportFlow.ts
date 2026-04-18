// TeleportFlow.ts  –  Main Place server
// Wraps TeleportService to send players to the Game Place with a typed payload.

import { TeleportService } from "@rbxts/services";
import type { TeleportData } from "@server-defend/shared/types/GameTypes";

// ⚠️ Assumption: replace with your actual Game Place ID before publishing.
const GAME_PLACE_ID = 0;

/**
 * Teleports a single player to the Game Place, passing TeleportData via
 * TeleportService's teleportOptions so the game server can read it with
 * TeleportService:GetLocalPlayerTeleportData().
 */
export function teleportToGamePlace(player: Player, data: TeleportData): void {
  const options = TeleportService.CreateTeleportOptions();
  options.SetTeleportData(data as unknown as object);
  options.ReservedServerAccessCode = undefined as unknown as string;

  const [ok, err] = pcall(() => {
    TeleportService.TeleportAsync(GAME_PLACE_ID, [player], options);
  });

  if (!ok) {
    warn(`[TeleportFlow] TeleportAsync failed for ${player.Name}: ${err}`);
  }
}

/**
 * Teleports a group of players together (party mode).
 */
export function teleportPartyToGamePlace(
  players: Player[],
  data: TeleportData,
): void {
  const options = TeleportService.CreateTeleportOptions();
  options.SetTeleportData(data as unknown as object);

  const [ok, err] = pcall(() => {
    TeleportService.TeleportAsync(GAME_PLACE_ID, players, options);
  });

  if (!ok) {
    warn(`[TeleportFlow] Party TeleportAsync failed: ${err}`);
  }
}
