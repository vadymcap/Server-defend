// WarningToast.tsx  –  Game Place client
// Individual warning/alert toast in the HUD toast stack.

import Roact from "@rbxts/roact";
import type { WarningMessage } from "@server-defend/shared/types/GameTypes";

const LEVEL_COLORS: Record<string, Color3> = {
  info: Color3.fromRGB(60, 130, 220),
  warning: Color3.fromRGB(220, 180, 60),
  danger: Color3.fromRGB(220, 60, 60),
};

const LEVEL_ICONS: Record<string, string> = {
  info: "ℹ",
  warning: "⚠",
  danger: "🚨",
};

export interface WarningToastProps {
  warning: WarningMessage;
}

export function WarningToast({ warning }: WarningToastProps): Roact.Element {
  const color = LEVEL_COLORS[warning.level] ?? Color3.fromRGB(220, 180, 60);
  const icon = LEVEL_ICONS[warning.level] ?? "⚠";

  return (
    <frame
      Key={warning.id}
      Size={new UDim2(1, 0, 0, 40)}
      BackgroundColor3={Color3.fromRGB(13, 18, 32)}
      BackgroundTransparency={0.1}
      BorderSizePixel={0}
    >
      <uicorner CornerRadius={new UDim(0, 6)} />
      <uistroke Color={color} Thickness={1} />
      <textlabel Key="Icon" Text={icon} Font={Enum.Font.GothamBold} TextScaled
        TextColor3={color} BackgroundTransparency={1}
        Size={new UDim2(0, 28, 1, 0)} Position={new UDim2(0, 6, 0, 0)} />
      <textlabel Key="Text" Text={warning.text} Font={Enum.Font.Gotham} TextScaled
        TextColor3={Color3.fromRGB(220, 230, 240)} BackgroundTransparency={1}
        Size={new UDim2(1, -40, 1, 0)} Position={new UDim2(0, 38, 0, 0)}
        TextXAlignment={Enum.TextXAlignment.Left} TextWrapped />
    </frame>
  );
}
