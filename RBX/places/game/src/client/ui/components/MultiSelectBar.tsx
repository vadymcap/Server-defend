// MultiSelectBar.tsx  –  Game Place client
// Action bar that appears when multiple nodes are selected (multi-select).

import Roact from "@rbxts/roact";

const C = {
  panel: Color3.fromRGB(13, 18, 32),
  border: Color3.fromRGB(30, 50, 80),
  accent: Color3.fromRGB(0, 220, 170),
  text: Color3.fromRGB(220, 230, 240),
  red: Color3.fromRGB(220, 60, 60),
  yellow: Color3.fromRGB(220, 180, 60),
};

export interface MultiSelectBarProps {
  selectedCount: number;
  onDeleteAll(): void;
  onDeselectAll(): void;
}

export function MultiSelectBar({ selectedCount, onDeleteAll, onDeselectAll }: MultiSelectBarProps): Roact.Element | undefined {
  if (selectedCount === 0) return undefined;

  return (
    <frame
      Key="MultiSelectBar"
      Size={new UDim2(0, 340, 0, 48)}
      Position={new UDim2(0.5, -170, 1, -140)}
      BackgroundColor3={C.panel}
      BackgroundTransparency={0.1}
      BorderSizePixel={0}
      ZIndex={15}
    >
      <uicorner CornerRadius={new UDim(0, 8)} />
      <uistroke Color={C.border} Thickness={2} />

      <frame Key="Inner" BackgroundTransparency={1}
        Size={new UDim2(1, -16, 1, 0)} Position={new UDim2(0, 8, 0, 0)}>
        <uilistlayout FillDirection={Enum.FillDirection.Horizontal}
          VerticalAlignment={Enum.VerticalAlignment.Center} Padding={new UDim(0, 10)} />

        <textlabel Key="Count" Text={`${selectedCount} selected`}
          Font={Enum.Font.GothamBold} TextScaled TextColor3={C.accent}
          BackgroundTransparency={1} Size={new UDim2(0, 120, 0, 32)} />

        <textbutton Key="Delete" Text="🗑 DELETE ALL" Font={Enum.Font.GothamBold} TextScaled
          TextColor3={C.red} BackgroundColor3={Color3.fromRGB(40, 15, 15)}
          BackgroundTransparency={0.3} BorderSizePixel={0}
          Size={new UDim2(0, 130, 0, 34)}
          Event={{ Activated: onDeleteAll }}>
          <uicorner CornerRadius={new UDim(0, 6)} />
          <uistroke Color={C.red} Thickness={1} />
        </textbutton>

        <textbutton Key="Deselect" Text="✕" Font={Enum.Font.GothamBold} TextScaled
          TextColor3={C.text} BackgroundColor3={C.panel}
          BackgroundTransparency={0.4} BorderSizePixel={0}
          Size={new UDim2(0, 36, 0, 34)}
          Event={{ Activated: onDeselectAll }}>
          <uicorner CornerRadius={new UDim(0, 6)} />
        </textbutton>
      </frame>
    </frame>
  );
}
