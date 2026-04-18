// bootstrap.client.ts  –  Main Place client entry point
// Mounts the Loading screen then transitions to Main Menu once the
// server fires sessionReady.

import Roact from "@rbxts/roact";
import { Players, RunService } from "@rbxts/services";
import Remotes from "@server-defend/shared/net/Definitions";
import { LoadingScreen } from "./ui/screens/LoadingScreen";
import { MainMenuScreen } from "./ui/screens/MainMenuScreen";

const player = Players.LocalPlayer;
const playerGui = player.WaitForChild("PlayerGui") as PlayerGui;

// ── Loading phase ──────────────────────────────────────────────────────────

let loadingHandle: Roact.Tree | undefined;
let mainMenuHandle: Roact.Tree | undefined;

function showLoadingScreen(): void {
  loadingHandle = Roact.mount(
    Roact.createElement(LoadingScreen, {
      progress: 0,
      statusText: "Connecting...",
      onComplete: () => {
        if (loadingHandle !== undefined) {
          Roact.unmount(loadingHandle);
          loadingHandle = undefined;
        }
        showMainMenu();
      },
    }),
    playerGui,
    "LoadingScreen",
  );
}

function showMainMenu(): void {
  // Check whether there is a saved game on this profile
  const hasSave = false; // Will be populated via listSaveSlots remote call
  mainMenuHandle = Roact.mount(
    Roact.createElement(MainMenuScreen, {
      canResume: false,
      hasSave,
    }),
    playerGui,
    "MainMenuScreen",
  );
}

// ── Session ready signal ───────────────────────────────────────────────────

Remotes.Client.Get("sessionReady").Connect(() => {
  // Server has finished initializing – loading screen can transition
  // The LoadingScreen component drives its own progress bar; when it
  // reports onComplete it will call showMainMenu() above.
});

// ── Bootstrap ─────────────────────────────────────────────────────────────

showLoadingScreen();
