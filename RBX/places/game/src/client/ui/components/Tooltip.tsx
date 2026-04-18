// Tooltip.tsx  –  Game Place client
// Floating info panel shown when hovering a service node.

import Roact from "@rbxts/roact";

const C = {
  panel: Color3.fromRGB(10, 15, 28),
  border: Color3.fromRGB(30, 50, 80),
  accent: Color3.fromRGB(0, 220, 170),
  text: Color3.fromRGB(220, 230, 240),
  textDim: Color3.fromRGB(130, 150, 160),
};

export interface TooltipProps {
  title: string;
  desc: string;
  stats: Array<{ label: string; value: string; color?: Color3 }>;
  screenPos: Vector2;
  visible: boolean;
}

export function Tooltip({ title, desc, stats, screenPos, visible }: TooltipProps): Roact.Element | undefined {
  if (!visible) return undefined;

  return (
    <frame
      Key="Tooltip"
      Size={new UDim2(0, 220, 0, 0)}
      Position={new UDim2(0, screenPos.X + 12, 0, screenPos.Y - 8)}
      AutomaticSize={Enum.AutomaticSize.Y}
      BackgroundColor3={C.panel}
      BackgroundTransparency={0.05}
      BorderSizePixel={0}
      ZIndex={50}
    >
      <uicorner CornerRadius={new UDim(0, 6)} />
      <uistroke Color={C.border} Thickness={1} />

      <frame Key="Inner" BackgroundTransparency={1}
        Size={new UDim2(1, -14, 0, 0)} Position={new UDim2(0, 7, 0, 7)}
        AutomaticSize={Enum.AutomaticSize.Y}>
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 4)} />

        <textlabel Key="Title" Text={title} Font={Enum.Font.GothamBold} TextScaled
          TextColor3={C.accent} BackgroundTransparency={1}
          Size={new UDim2(1, 0, 0, 18)} />

        <textlabel Key="Desc" Text={desc} Font={Enum.Font.Gotham} TextScaled
          TextColor3={C.text} BackgroundTransparency={1}
          Size={new UDim2(1, 0, 0, 0)} AutomaticSize={Enum.AutomaticSize.Y}
          TextWrapped />

        {stats.map((s, i) => (
          <frame Key={tostring(i)} BackgroundTransparency={1} Size={new UDim2(1, 0, 0, 16)}>
            <textlabel Key="Label" Text={s.label} Font={Enum.Font.Gotham} TextScaled
              TextColor3={C.textDim} BackgroundTransparency={1}
              Size={new UDim2(0.5, 0, 1, 0)} TextXAlignment={Enum.TextXAlignment.Left} />
            <textlabel Key="Value" Text={s.value} Font={Enum.Font.GothamBold} TextScaled
              TextColor3={s.color ?? C.text} BackgroundTransparency={1}
              Size={new UDim2(0.5, 0, 1, 0)} Position={new UDim2(0.5, 0, 0, 0)}
              TextXAlignment={Enum.TextXAlignment.Right} />
          </frame>
        ))}
      </frame>
    </frame>
  );
}
