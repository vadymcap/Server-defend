// bootstrap.server.ts  –  Main Place server entry point
// Handles player sessions, fires sessionReady, delegates teleport to TeleportFlow.

import { Players } from "@rbxts/services";
import Remotes from "@server-defend/shared/net/Definitions";
import { handleSessionInit, handleSessionResume, handleSessionLoad } from "./services/SessionService";
import { teleportToGamePlace } from "./teleport/TeleportFlow";
import { loadProfile, saveProfile } from "./persistence/ProfileService";

// ── Player lifecycle ──────────────────────────────────────────────────────

Players.PlayerAdded.Connect((player) => {
  // Load or create the player's profile
  const profile = loadProfile(player);

  // Tell the client it can transition Loading → Main Menu
  task.delay(1.0, () => {
    Remotes.Server.Get("sessionReady").SendToPlayer(player);
  });

  // Populate listSaveSlots for the player
  Remotes.Server.Get("listSaveSlots").SetCallback((requestingPlayer: Player) => {
    if (requestingPlayer !== player) return [];
    const saves = profile.data.saves;
    const keys: string[] = [];
    for (const [k] of pairs(saves as object)) {
      keys.push(k as string);
    }
    return keys;
  });
});

Players.PlayerRemoving.Connect((player) => {
  saveProfile(player);
});

// ── Session remotes ───────────────────────────────────────────────────────

Remotes.Server.Get("sessionInit").Connect((player, payload) => {
  handleSessionInit(player, payload, teleportToGamePlace);
});

Remotes.Server.Get("sessionResume").Connect((player) => {
  handleSessionResume(player);
});

Remotes.Server.Get("sessionLoad").Connect((player, slot) => {
  handleSessionLoad(player, slot);
});

// ── Sound settings persistence ─────────────────────────────────────────────

Remotes.Server.Get("soundSettingsSet").Connect((player, settings) => {
  const profile = loadProfile(player);
  profile.data.options.sound = settings;
});

print("[Main Server] Ready");
