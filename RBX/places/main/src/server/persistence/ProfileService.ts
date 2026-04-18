// ProfileService.ts  –  Main Place server
// Thin wrapper around @rbxts/profilestore for the Main Place.
// The same DataStore key pattern is used in the Game Place so that
// profiles can be read/written from both places.

import ProfileStore from "@rbxts/profilestore";
import type { PlayerProfileData } from "@server-defend/shared/types/GameTypes";

const DEFAULT_DATA: PlayerProfileData = {
  tutorial: {
    classicComplete: false,
    mlopsComplete: false,
  },
  options: {
    locale: "en",
    sound: {
      master: { vol: 1, on: true },
      bgm: { vol: 0.5, on: true },
      ui: { vol: 0.8, on: true },
      events: { vol: 1, on: true },
      gameplay: { vol: 0.8, on: true },
    },
  },
  saves: {},
  stats: {
    highScore: 0,
    longestRunSec: 0,
    totalRuns: 0,
  },
};

export interface PlayerProfile {
  data: PlayerProfileData;
  player: Player;
}

// In-memory cache keyed by UserId
const activeProfiles = new Map<number, PlayerProfile>();

const Store = ProfileStore.New<PlayerProfileData>("PlayerData_v1", DEFAULT_DATA);

export function loadProfile(player: Player): PlayerProfile {
  const existing = activeProfiles.get(player.UserId);
  if (existing !== undefined) return existing;

  const profile = Store.StartSessionAsync(`Player_${player.UserId}`, {
    Cancel: () => player.Parent !== game.GetService("Players"),
  });

  if (profile === undefined) {
    player.Kick("Failed to load data. Please rejoin.");
    // Return a dummy so callers don't crash
    return { data: DEFAULT_DATA, player };
  }

  profile.AddUserId(player.UserId);
  profile.Reconcile();

  const entry: PlayerProfile = { data: profile.Data, player };
  activeProfiles.set(player.UserId, entry);

  player.AncestryChanged.Connect(() => {
    if (!player.IsDescendantOf(game)) {
      activeProfiles.delete(player.UserId);
      profile.EndSession();
    }
  });

  return entry;
}

export function saveProfile(player: Player): void {
  const entry = activeProfiles.get(player.UserId);
  if (entry === undefined) return;
  // EndSession triggers auto-save; explicit manual save not needed.
  activeProfiles.delete(player.UserId);
}
