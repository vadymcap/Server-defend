// SoundPanel.tsx  –  Game Place client
// Sound category volume/on-off controls.
// Appears as a popover triggered by the toolbar 🔊 button.

import Roact from "@rbxts/roact";
import { hooked, useState } from "@rbxts/roact-hooked";
import Remotes from "@server-defend/shared/net/Definitions";
import type { SoundCategoryStateMap, SoundCategoryState } from "@server-defend/shared/types/GameTypes";

const C = {
  panel: Color3.fromRGB(13, 18, 32),
  border: Color3.fromRGB(30, 50, 80),
  accent: Color3.fromRGB(0, 220, 170),
  text: Color3.fromRGB(220, 230, 240),
  textDim: Color3.fromRGB(130, 150, 160),
  green: Color3.fromRGB(60, 200, 100),
  red: Color3.fromRGB(220, 60, 60),
};

export interface SoundPanelProps {
  visible: boolean;
  categories: SoundCategoryStateMap;
}

const CATEGORY_LABELS: Record<keyof SoundCategoryStateMap, string> = {
  master: "Master",
  bgm: "Music",
  ui: "UI",
  events: "Events",
  gameplay: "Gameplay",
};

interface VolRowProps {
  label: string;
  cat: SoundCategoryState;
  onToggle(): void;
  onVolChange(v: number): void;
}

function VolRow({ label, cat, onToggle, onVolChange }: VolRowProps): Roact.Element {
  return (
    <frame Key={label} BackgroundTransparency={1} Size={new UDim2(1, 0, 0, 28)}>
      <textbutton Key="Toggle" Text={cat.on ? "🔊" : "🔇"} Font={Enum.Font.GothamBold} TextScaled
        TextColor3={cat.on ? C.green : C.red} BackgroundTransparency={1} BorderSizePixel={0}
        Size={new UDim2(0, 28, 1, 0)} Event={{ Activated: onToggle }} />
      <textlabel Key="Label" Text={label} Font={Enum.Font.Gotham} TextScaled
        TextColor3={C.textDim} BackgroundTransparency={1}
        Size={new UDim2(0.35, 0, 1, 0)} Position={new UDim2(0, 32, 0, 0)}
        TextXAlignment={Enum.TextXAlignment.Left} />
      {/* Vol - */}
      <textbutton Key="Dec" Text="-" Font={Enum.Font.GothamBold} TextScaled
        TextColor3={C.text} BackgroundColor3={Color3.fromRGB(30,30,40)} BackgroundTransparency={0.3}
        BorderSizePixel={0} Size={new UDim2(0, 22, 0.8, 0)}
        Position={new UDim2(0.58, 0, 0.1, 0)}
        Event={{ Activated: () => onVolChange(math.max(0, cat.vol - 0.1)) }}>
        <uicorner CornerRadius={new UDim(0, 4)} />
      </textbutton>
      {/* Vol value */}
      <textlabel Key="Vol" Text={`${math.floor(cat.vol * 100)}%`}
        Font={Enum.Font.GothamBold} TextScaled TextColor3={C.accent}
        BackgroundTransparency={1} Size={new UDim2(0.16, 0, 1, 0)}
        Position={new UDim2(0.72, 0, 0, 0)} TextXAlignment={Enum.TextXAlignment.Center} />
      {/* Vol + */}
      <textbutton Key="Inc" Text="+" Font={Enum.Font.GothamBold} TextScaled
        TextColor3={C.text} BackgroundColor3={Color3.fromRGB(30,30,40)} BackgroundTransparency={0.3}
        BorderSizePixel={0} Size={new UDim2(0, 22, 0.8, 0)}
        Position={new UDim2(0.88, 0, 0.1, 0)}
        Event={{ Activated: () => onVolChange(math.min(1, cat.vol + 0.1)) }}>
        <uicorner CornerRadius={new UDim(0, 4)} />
      </textbutton>
    </frame>
  );
}

function SoundPanelComponent(props: SoundPanelProps): Roact.Element | undefined {
  if (!props.visible) return undefined;

  const [cats, setCats] = useState<SoundCategoryStateMap>(props.categories);

  function update(key: keyof SoundCategoryStateMap, patch: Partial<SoundCategoryState>): void {
    const next: SoundCategoryStateMap = { ...cats, [key]: { ...cats[key], ...patch } };
    setCats(next);
    Remotes.Client.Get("soundSettingsSet").SendToServer(next);
  }

  return (
    <frame Key="SoundPanel"
      Size={new UDim2(0, 260, 0, 0)} Position={new UDim2(1, -270, 1, -240)}
      AutomaticSize={Enum.AutomaticSize.Y}
      BackgroundColor3={C.panel} BackgroundTransparency={0.05}
      BorderSizePixel={0} ZIndex={20}>
      <uicorner CornerRadius={new UDim(0, 8)} />
      <uistroke Color={C.border} Thickness={1} />

      <frame Key="Inner" BackgroundTransparency={1}
        Size={new UDim2(1, -16, 0, 0)} Position={new UDim2(0, 8, 0, 8)}
        AutomaticSize={Enum.AutomaticSize.Y}>
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 6)} />

        <textlabel Key="Title" Text="🔊 SOUND" Font={Enum.Font.GothamBold} TextScaled
          TextColor3={C.accent} BackgroundTransparency={1} Size={new UDim2(1, 0, 0, 24)} />

        {(["master", "bgm", "ui", "events", "gameplay"] as const).map((key) => (
          <VolRow
            key={key}
            label={CATEGORY_LABELS[key]}
            cat={cats[key]}
            onToggle={() => update(key, { on: !cats[key].on })}
            onVolChange={(v) => update(key, { vol: v })}
          />
        ))}
      </frame>
    </frame>
  );
}

export const SoundPanel = hooked(SoundPanelComponent);
