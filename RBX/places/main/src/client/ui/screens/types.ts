// types.ts  –  screen prop/state types (main place client)
import type { GameMode } from "@server-defend/shared/types/GameTypes";

export interface LoadingScreenProps {
  progress: number;   // 0–1
  statusText: string;
  onComplete(): void;
}

export interface MainMenuProps {
  canResume: boolean;
  hasSave: boolean;
}

export type MainMenuPanel = "root" | "settings" | "credits";
export type MainMenuSelectedMode = GameMode;
