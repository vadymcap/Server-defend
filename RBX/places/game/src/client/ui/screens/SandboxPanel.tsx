// SandboxPanel.tsx  –  Game Place client
// Free-edit panel for Sandbox mode: budget, RPS, traffic mix, burst.
// Mirrors #sandboxPanel from index.html.

import Roact from "@rbxts/roact";
import { hooked, useState } from "@rbxts/roact-hooked";
import Remotes from "@server-defend/shared/net/Definitions";
import type { SandboxState } from "@server-defend/shared/types/GameTypes";

const C = {
  panel: Color3.fromRGB(13, 18, 32),
  border: Color3.fromRGB(30, 50, 80),
  accent: Color3.fromRGB(0, 220, 170),
  text: Color3.fromRGB(220, 230, 240),
  textDim: Color3.fromRGB(130, 150, 160),
  green: Color3.fromRGB(60, 200, 100),
  yellow: Color3.fromRGB(220, 180, 60),
  blue: Color3.fromRGB(60, 130, 220),
  orange: Color3.fromRGB(220, 130, 60),
  red: Color3.fromRGB(220, 60, 60),
  cyan: Color3.fromRGB(60, 200, 220),
};

export interface SandboxPanelProps {
  sandbox: SandboxState;
}

const TRAFFIC_LABELS: Record<string, { label: string; color: Color3 }> = {
  STATIC: { label: "STATIC", color: C.green },
  READ: { label: "READ", color: C.blue },
  WRITE: { label: "WRITE", color: C.orange },
  UPLOAD: { label: "UPLOAD", color: C.yellow },
  SEARCH: { label: "SEARCH", color: C.cyan },
  MALICIOUS: { label: "MALICIOUS", color: C.red },
};

interface SliderRowProps {
  label: string;
  value: number;
  color: Color3;
  min: number;
  max: number;
  onChange(v: number): void;
}

// Simple step-based "slider" using +/- buttons (Roblox has no native slider)
function SliderRow({ label, value, color, min, max, onChange }: SliderRowProps): Roact.Element {
  return (
    <frame Key={label} BackgroundTransparency={1} Size={new UDim2(1, 0, 0, 28)}>
      <textlabel Key="Label" Text={label} Font={Enum.Font.Gotham} TextScaled
        TextColor3={color} BackgroundTransparency={1}
        Size={new UDim2(0.45, 0, 1, 0)} TextXAlignment={Enum.TextXAlignment.Left} />
      <textbutton Key="Dec" Text="-" Font={Enum.Font.GothamBold} TextScaled
        TextColor3={C.text} BackgroundColor3={Color3.fromRGB(30, 30, 40)} BackgroundTransparency={0.2}
        BorderSizePixel={0} Size={new UDim2(0, 24, 0.8, 0)} Position={new UDim2(0.45, 0, 0.1, 0)}
        Event={{ Activated: () => onChange(math.max(min, value - 5)) }}>
        <uicorner CornerRadius={new UDim(0, 4)} />
      </textbutton>
      <textlabel Key="Value" Text={`${math.floor(value)}%`} Font={Enum.Font.GothamBold} TextScaled
        TextColor3={C.text} BackgroundTransparency={1}
        Size={new UDim2(0.18, 0, 1, 0)} Position={new UDim2(0.62, 0, 0, 0)}
        TextXAlignment={Enum.TextXAlignment.Center} />
      <textbutton Key="Inc" Text="+" Font={Enum.Font.GothamBold} TextScaled
        TextColor3={C.text} BackgroundColor3={Color3.fromRGB(30, 30, 40)} BackgroundTransparency={0.2}
        BorderSizePixel={0} Size={new UDim2(0, 24, 0.8, 0)} Position={new UDim2(0.82, 0, 0.1, 0)}
        Event={{ Activated: () => onChange(math.min(max, value + 5)) }}>
        <uicorner CornerRadius={new UDim(0, 4)} />
      </textbutton>
    </frame>
  );
}

function SandboxPanelComponent(props: SandboxPanelProps): Roact.Element {
  const sb = props.sandbox;
  const [mixDraft, setMixDraft] = useState(sb.trafficMix);

  function pushMix(): void {
    Remotes.Client.Get("sandboxSetTrafficMix").SendToServer(mixDraft);
  }

  function updateMix(key: string, val: number): void {
    const updated = { ...mixDraft, [key]: val };
    setMixDraft(updated);
    Remotes.Client.Get("sandboxSetTrafficMix").SendToServer(updated);
  }

  return (
    <frame Key="SandboxPanel"
      Size={new UDim2(0, 240, 0, 0)} Position={new UDim2(0, 8, 0, 64)}
      AutomaticSize={Enum.AutomaticSize.Y}
      BackgroundColor3={C.panel} BackgroundTransparency={0.15} BorderSizePixel={0}>
      <uicorner CornerRadius={new UDim(0, 8)} />
      <uistroke Color={C.border} Thickness={1} />

      <frame Key="Inner" BackgroundTransparency={1}
        Size={new UDim2(1, -16, 0, 0)} Position={new UDim2(0, 8, 0, 8)}
        AutomaticSize={Enum.AutomaticSize.Y}>
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 6)} />

        <textlabel Key="Title" Text="🧪 SANDBOX CONTROLS" Font={Enum.Font.GothamBold} TextScaled
          TextColor3={C.accent} BackgroundTransparency={1} Size={new UDim2(1, 0, 0, 24)} />

        {/* Budget */}
        <frame Key="BudgetRow" BackgroundTransparency={1} Size={new UDim2(1, 0, 0, 28)}>
          <textlabel Key="L" Text="BUDGET" Font={Enum.Font.Gotham} TextScaled
            TextColor3={C.textDim} BackgroundTransparency={1}
            Size={new UDim2(0.45, 0, 1, 0)} TextXAlignment={Enum.TextXAlignment.Left} />
          <textbutton Key="Dec" Text="-$100" Font={Enum.Font.Gotham} TextScaled TextColor3={C.red}
            BackgroundColor3={Color3.fromRGB(30,30,40)} BackgroundTransparency={0.2}
            BorderSizePixel={0} Size={new UDim2(0, 56, 0.8, 0)} Position={new UDim2(0.45, 0, 0.1, 0)}
            Event={{ Activated: () => Remotes.Client.Get("sandboxSetBudget").SendToServer(math.max(0, sb.budget - 100)) }}>
            <uicorner CornerRadius={new UDim(0, 4)} />
          </textbutton>
          <textlabel Key="V" Text={`$${sb.budget}`} Font={Enum.Font.GothamBold} TextScaled
            TextColor3={C.yellow} BackgroundTransparency={1}
            Size={new UDim2(0.18, 0, 1, 0)} Position={new UDim2(0.62, 0, 0, 0)}
            TextXAlignment={Enum.TextXAlignment.Center} />
          <textbutton Key="Inc" Text="+$100" Font={Enum.Font.Gotham} TextScaled TextColor3={C.green}
            BackgroundColor3={Color3.fromRGB(30,30,40)} BackgroundTransparency={0.2}
            BorderSizePixel={0} Size={new UDim2(0, 56, 0.8, 0)} Position={new UDim2(0.82, 0, 0.1, 0)}
            Event={{ Activated: () => Remotes.Client.Get("sandboxSetBudget").SendToServer(sb.budget + 100) }}>
            <uicorner CornerRadius={new UDim(0, 4)} />
          </textbutton>
        </frame>

        {/* RPS */}
        <frame Key="RpsRow" BackgroundTransparency={1} Size={new UDim2(1, 0, 0, 28)}>
          <textlabel Key="L" Text="RPS" Font={Enum.Font.Gotham} TextScaled
            TextColor3={C.textDim} BackgroundTransparency={1}
            Size={new UDim2(0.45, 0, 1, 0)} TextXAlignment={Enum.TextXAlignment.Left} />
          <textbutton Key="Dec" Text="-0.5" Font={Enum.Font.Gotham} TextScaled TextColor3={C.red}
            BackgroundColor3={Color3.fromRGB(30,30,40)} BackgroundTransparency={0.2}
            BorderSizePixel={0} Size={new UDim2(0, 48, 0.8, 0)} Position={new UDim2(0.45, 0, 0.1, 0)}
            Event={{ Activated: () => Remotes.Client.Get("sandboxSetRps").SendToServer(math.max(0.1, sb.rps - 0.5)) }}>
            <uicorner CornerRadius={new UDim(0, 4)} />
          </textbutton>
          <textlabel Key="V" Text={`${string.format("%.1f", sb.rps)}`} Font={Enum.Font.GothamBold}
            TextScaled TextColor3={C.blue} BackgroundTransparency={1}
            Size={new UDim2(0.18, 0, 1, 0)} Position={new UDim2(0.62, 0, 0, 0)}
            TextXAlignment={Enum.TextXAlignment.Center} />
          <textbutton Key="Inc" Text="+0.5" Font={Enum.Font.Gotham} TextScaled TextColor3={C.green}
            BackgroundColor3={Color3.fromRGB(30,30,40)} BackgroundTransparency={0.2}
            BorderSizePixel={0} Size={new UDim2(0, 48, 0.8, 0)} Position={new UDim2(0.82, 0, 0.1, 0)}
            Event={{ Activated: () => Remotes.Client.Get("sandboxSetRps").SendToServer(sb.rps + 0.5) }}>
            <uicorner CornerRadius={new UDim(0, 4)} />
          </textbutton>
        </frame>

        {/* Traffic mix */}
        <textlabel Key="MixTitle" Text="TRAFFIC MIX" Font={Enum.Font.GothamBold} TextScaled
          TextColor3={C.accent} BackgroundTransparency={1} Size={new UDim2(1, 0, 0, 20)} />

        {(["STATIC", "READ", "WRITE", "UPLOAD", "SEARCH", "MALICIOUS"] as const).map((key) => (
          <SliderRow
            key={key}
            label={TRAFFIC_LABELS[key].label}
            color={TRAFFIC_LABELS[key].color}
            value={mixDraft[key]}
            min={0}
            max={100}
            onChange={(v) => updateMix(key, v)}
          />
        ))}

        {/* Burst */}
        <textlabel Key="BurstTitle" Text="BURST SPAWN" Font={Enum.Font.GothamBold} TextScaled
          TextColor3={C.yellow} BackgroundTransparency={1} Size={new UDim2(1, 0, 0, 20)} />
        {(["STATIC", "READ", "MALICIOUS"] as const).map((t) => (
          <textbutton Key={`burst_${t}`}
            Text={`Spawn ${t} burst`} Font={Enum.Font.Gotham} TextScaled
            TextColor3={TRAFFIC_LABELS[t].color}
            BackgroundColor3={Color3.fromRGB(30, 30, 40)} BackgroundTransparency={0.2}
            BorderSizePixel={0} Size={new UDim2(1, 0, 0, 28)}
            Event={{
              Activated: () =>
                Remotes.Client.Get("sandboxSpawnBurst").SendToServer({
                  type: t,
                  count: sb.burstCount,
                }),
            }}>
            <uicorner CornerRadius={new UDim(0, 4)} />
          </textbutton>
        ))}

        {/* Upkeep toggle */}
        <textbutton Key="UpkeepToggle"
          Text={sb.upkeepEnabled ? "⚙ UPKEEP: ON" : "⚙ UPKEEP: OFF"}
          Font={Enum.Font.GothamBold} TextScaled
          TextColor3={sb.upkeepEnabled ? C.red : C.green}
          BackgroundColor3={Color3.fromRGB(30,30,40)} BackgroundTransparency={0.2}
          BorderSizePixel={0} Size={new UDim2(1, 0, 0, 32)}
          Event={{ Activated: () => Remotes.Client.Get("sandboxToggleUpkeep").SendToServer(!sb.upkeepEnabled) }}>
          <uicorner CornerRadius={new UDim(0, 6)} />
        </textbutton>
      </frame>
    </frame>
  );
}

export const SandboxPanel = hooked(SandboxPanelComponent);
