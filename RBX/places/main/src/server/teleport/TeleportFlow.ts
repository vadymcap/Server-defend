// TeleportFlow.ts  –  Main Place server
// Wraps TeleportService to send players to the Game Place with a typed payload.

import { TeleportService } from "@rbxts/services";
import type { TeleportData } from "@server-defend/shared/types/GameTypes";

// ⚠️ Assumption: replace GAME_PLACE_ID with your published Game Place ID.
// A value of 0 is a guard that prevents accidental teleports during development.
const GAME_PLACE_ID: number =
  (game.GetService("RunService").IsStudio() ? 0 : 0); // TODO: set real place ID

/**
 * Teleports a single player to the Game Place, passing TeleportData via
 * TeleportService's teleportOptions so the game server can read it with
 * TeleportService:GetLocalPlayerTeleportData().
 */
export function teleportToGamePlace(player: Player, data: TeleportData): void {
  if (GAME_PLACE_ID === 0) {
    warn("[TeleportFlow] GAME_PLACE_ID is 0 – teleport skipped. Set a real place ID.");
    return;
  }
  const options = TeleportService.CreateTeleportOptions();
  options.SetTeleportData(data as unknown as object);

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
