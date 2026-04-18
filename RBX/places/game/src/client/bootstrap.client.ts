// bootstrap.client.ts  –  Game Place client entry point
// Mounts the full HUD and wires up remotes.

import Roact from "@rbxts/roact";
import { Players, RunService } from "@rbxts/services";
import Remotes from "@server-defend/shared/net/Definitions";
import { CameraController } from "./camera/CameraController";
import { GameplayHUDScreen } from "./ui/screens/GameplayHUDScreen";
import { TutorialOverlay } from "./ui/screens/TutorialOverlay";
import { GameOverScreen } from "./ui/screens/GameOverScreen";
import type {
  GameSnapshot,
  WarningMessage,
  ActiveEventState,
  FailureAnalysisPayload,
  TutorialStepState,
} from "@server-defend/shared/types/GameTypes";

const player = Players.LocalPlayer;
const playerGui = player.WaitForChild("PlayerGui") as PlayerGui;

// ── Camera ────────────────────────────────────────────────────────────────
const camera = new CameraController({ zoom: 80 });
camera.start();

// ── State held client-side for Roact re-renders ───────────────────────────
let hudTree: Roact.Tree | undefined;
let tutorialTree: Roact.Tree | undefined;
let gameOverTree: Roact.Tree | undefined;

let lastSnapshot: GameSnapshot | undefined;
let warningQueue: WarningMessage[] = [];
let currentEvent: ActiveEventState | undefined;
let currentTutorialStep: TutorialStepState | undefined;

function rerenderHUD(): void {
  if (lastSnapshot === undefined) return;

  const element = Roact.createElement(GameplayHUDScreen, {
    snapshot: lastSnapshot,
    warnings: warningQueue,
    activeEvent: currentEvent,
  });

  if (hudTree === undefined) {
    hudTree = Roact.mount(element, playerGui, "HUD");
  } else {
    Roact.update(hudTree, element);
  }
}

function rerenderTutorial(): void {
  const element = Roact.createElement(TutorialOverlay, {
    step: currentTutorialStep,
    visible: currentTutorialStep !== undefined,
  });

  if (tutorialTree === undefined) {
    tutorialTree = Roact.mount(element, playerGui, "Tutorial");
  } else {
    Roact.update(tutorialTree, element);
  }
}

// ── Remotes ───────────────────────────────────────────────────────────────

Remotes.Client.Get("stateSnapshot").Connect((snapshot) => {
  lastSnapshot = snapshot;
  rerenderHUD();
});

Remotes.Client.Get("interventionWarning").Connect((msg) => {
  warningQueue = [...warningQueue, msg];
  // Expire old warnings
  const now = os.clock() * 1000;
  warningQueue = warningQueue.filter((w) => w.expiresAt > now);
  rerenderHUD();
});

Remotes.Client.Get("activeEventChanged").Connect((event) => {
  currentEvent = event;
  rerenderHUD();
});

Remotes.Client.Get("gameOver").Connect((payload: FailureAnalysisPayload) => {
  // Unmount HUD, show game-over screen
  if (hudTree !== undefined) {
    Roact.unmount(hudTree);
    hudTree = undefined;
  }

  gameOverTree = Roact.mount(
    Roact.createElement(GameOverScreen, {
      result: payload,
      onRetrySame: () => {
        Remotes.Client.Get("retrySameArchitecture").SendToServer();
        if (gameOverTree !== undefined) {
          Roact.unmount(gameOverTree);
          gameOverTree = undefined;
        }
      },
      onRestartFresh: () => {
        Remotes.Client.Get("restartSession").SendToServer();
        if (gameOverTree !== undefined) {
          Roact.unmount(gameOverTree);
          gameOverTree = undefined;
        }
      },
    }),
    playerGui,
    "GameOver",
  );
});

Remotes.Client.Get("tutorialState").Connect((step) => {
  currentTutorialStep = step;
  rerenderTutorial();
});

print("[Game Client] Ready");
