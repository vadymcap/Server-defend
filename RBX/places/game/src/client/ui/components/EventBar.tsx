// EventBar.tsx  –  Game Place client
// Narrow banner at the top of the screen showing the active random event
// and a countdown progress bar.

import Roact from "@rbxts/roact";
import type { ActiveEventState } from "@server-defend/shared/types/GameTypes";

const EVENT_COLORS: Record<string, Color3> = {
  COST_SPIKE: Color3.fromRGB(220, 180, 60),
  CAPACITY_DROP: Color3.fromRGB(220, 60, 60),
  TRAFFIC_BURST: Color3.fromRGB(60, 130, 220),
  SERVICE_OUTAGE: Color3.fromRGB(220, 60, 60),
};

const EVENT_ICONS: Record<string, string> = {
  COST_SPIKE: "💰",
  CAPACITY_DROP: "📉",
  TRAFFIC_BURST: "🌊",
  SERVICE_OUTAGE: "⚡",
};

const EVENT_LABELS: Record<string, string> = {
  COST_SPIKE: "CLOUD PRICE SURGE",
  CAPACITY_DROP: "SERVICE DEGRADATION",
  TRAFFIC_BURST: "VIRAL TRAFFIC BURST",
  SERVICE_OUTAGE: "SERVICE OUTAGE",
};

export interface EventBarProps {
  event: ActiveEventState;
}

export function EventBar({ event }: EventBarProps): Roact.Element {
  const color = EVENT_COLORS[event.type] ?? Color3.fromRGB(220, 60, 60);
  const icon = EVENT_ICONS[event.type] ?? "⚠";
  const label = EVENT_LABELS[event.type] ?? event.type;
  const progress = event.durationMs > 0 ? event.remainingMs / event.durationMs : 0;

  return (
    <frame
      Key="EventBar"
      Size={new UDim2(1, 0, 0, 28)}
      Position={new UDim2(0, 0, 0, 0)}
      BackgroundColor3={color}
      BackgroundTransparency={0.7}
      BorderSizePixel={0}
      ZIndex={10}
    >
      {/* Progress fill */}
      <frame Key="Fill" Size={new UDim2(progress, 0, 1, 0)}
        BackgroundColor3={color} BackgroundTransparency={0.4} BorderSizePixel={0} />

      <textlabel Key="Label"
        Text={`${icon}  ${label}  — ${math.ceil(event.remainingMs / 1000)}s`}
        Font={Enum.Font.GothamBold} TextScaled TextColor3={Color3.fromRGB(255, 255, 255)}
        BackgroundTransparency={1} Size={new UDim2(1, 0, 1, 0)}
        TextXAlignment={Enum.TextXAlignment.Center} />
    </frame>
  );
}
