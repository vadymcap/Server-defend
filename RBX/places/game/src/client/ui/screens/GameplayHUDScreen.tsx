// GameplayHUDScreen.tsx  –  Game Place client
// The main in-game HUD: stats bar, event bar, warning toast stack,
// objectives panel, finances panel, sandbox panel (conditional).

import Roact from "@rbxts/roact";
import { hooked, useState } from "@rbxts/roact-hooked";
import type {
  GameSnapshot,
  WarningMessage,
  ActiveEventState,
} from "@server-defend/shared/types/GameTypes";
import Remotes from "@server-defend/shared/net/Definitions";
import { EventBar } from "../components/EventBar";
import { WarningToast } from "../components/WarningToast";
import { ToolbarScreen } from "./ToolbarScreen";
import { SandboxPanel } from "./SandboxPanel";
import { formatTime } from "@server-defend/shared/util/MathUtil";

const C = {
  bg: Color3.fromRGB(8, 10, 20),
  panel: Color3.fromRGB(13, 18, 32),
  border: Color3.fromRGB(30, 50, 80),
  accent: Color3.fromRGB(0, 220, 170),
  text: Color3.fromRGB(220, 230, 240),
  textDim: Color3.fromRGB(130, 150, 160),
  green: Color3.fromRGB(60, 200, 100),
  red: Color3.fromRGB(220, 60, 60),
  yellow: Color3.fromRGB(220, 180, 60),
  blue: Color3.fromRGB(60, 130, 220),
  orange: Color3.fromRGB(220, 130, 60),
};

export interface GameplayHUDProps {
  snapshot: GameSnapshot;
  warnings: WarningMessage[];
  activeEvent?: ActiveEventState;
}

interface StatBarItemProps {
  label: string;
  value: string;
  color: Color3;
}

function StatBarItem({ label, value, color }: StatBarItemProps): Roact.Element {
  return (
    <frame Key={label} BackgroundTransparency={1} Size={new UDim2(0, 110, 1, 0)}>
      <textlabel Key="Label" Text={label} Font={Enum.Font.Gotham} TextScaled
        TextColor3={C.textDim} BackgroundTransparency={1}
        Size={new UDim2(1, 0, 0.45, 0)} Position={new UDim2(0, 0, 0, 0)}
        TextXAlignment={Enum.TextXAlignment.Left} />
      <textlabel Key="Value" Text={value} Font={Enum.Font.GothamBold} TextScaled
        TextColor3={color} BackgroundTransparency={1}
        Size={new UDim2(1, 0, 0.55, 0)} Position={new UDim2(0, 0, 0.45, 0)}
        TextXAlignment={Enum.TextXAlignment.Left} />
    </frame>
  );
}

function TimeControls({ snapshot }: { snapshot: GameSnapshot }): Roact.Element {
  return (
    <frame Key="TimeControls" BackgroundTransparency={1} Size={new UDim2(0, 130, 1, 0)}>
      <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, 4)} />
      {([0, 1, 3] as const).map((scale) => (
        <textbutton
          Key={tostring(scale)}
          Text={scale === 0 ? "⏸" : scale === 1 ? "▶" : "⏩"}
          Font={Enum.Font.GothamBold}
          TextScaled
          TextColor3={snapshot.timeScale === scale ? C.accent : C.textDim}
          BackgroundColor3={snapshot.timeScale === scale ? Color3.fromRGB(20, 40, 60) : C.panel}
          BackgroundTransparency={0.2}
          BorderSizePixel={0}
          Size={new UDim2(0, 36, 1, 0)}
          Event={{
            Activated: () =>
              Remotes.Client.Get("setTimeScale").SendToServer(scale),
          }}
        >
          <uicorner CornerRadius={new UDim(0, 4)} />
        </textbutton>
      ))}
    </frame>
  );
}

function ReputationBar({ reputation }: { reputation: number }): Roact.Element {
  const pct = math.max(0, math.min(100, reputation));
  const barColor = pct > 50 ? C.green : pct > 20 ? C.yellow : C.red;
  return (
    <frame Key="RepBar" BackgroundTransparency={1} Size={new UDim2(0, 140, 1, 0)}>
      <textlabel Key="Label" Text="REPUTATION" Font={Enum.Font.Gotham} TextScaled
        TextColor3={C.textDim} BackgroundTransparency={1}
        Size={new UDim2(1, 0, 0.4, 0)} />
      <frame Key="Track" BackgroundColor3={Color3.fromRGB(30, 30, 40)} BorderSizePixel={0}
        Size={new UDim2(1, 0, 0.3, 0)} Position={new UDim2(0, 0, 0.5, 0)}>
        <uicorner CornerRadius={new UDim(1, 0)} />
        <frame Key="Fill" BackgroundColor3={barColor} BorderSizePixel={0}
          Size={new UDim2(pct / 100, 0, 1, 0)}>
          <uicorner CornerRadius={new UDim(1, 0)} />
        </frame>
      </frame>
      <textlabel Key="Value" Text={`${math.floor(pct)}%`} Font={Enum.Font.GothamBold}
        TextScaled TextColor3={barColor} BackgroundTransparency={1}
        Size={new UDim2(0.4, 0, 0.3, 0)} Position={new UDim2(0.6, 0, 0.5, 0)}
        TextXAlignment={Enum.TextXAlignment.Right} />
    </frame>
  );
}

function GameplayHUDComponent(props: GameplayHUDProps): Roact.Element {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const sn = props.snapshot;

  function togglePanel(key: string): void {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <screengui Key="HUDGui" ZIndexBehavior={Enum.ZIndexBehavior.Sibling} ResetOnSpawn={false} IgnoreGuiInset>

      {/* ── Event bar (top of screen) ─────────────────────────────── */}
      {props.activeEvent && <EventBar event={props.activeEvent} />}

      {/* ── Top stats bar ────────────────────────────────────────── */}
      <frame
        Key="TopBar"
        Size={new UDim2(1, 0, 0, 52)}
        Position={new UDim2(0, 0, 0, props.activeEvent ? 32 : 0)}
        BackgroundColor3={C.panel}
        BackgroundTransparency={0.1}
        BorderSizePixel={0}
        ZIndex={5}
      >
        <uistroke Color={C.border} Thickness={1} />
        <frame Key="Items" BackgroundTransparency={1}
          Size={new UDim2(1, -16, 1, 0)} Position={new UDim2(0, 8, 0, 0)}>
          <uilistlayout FillDirection={Enum.FillDirection.Horizontal}
            VerticalAlignment={Enum.VerticalAlignment.Center} Padding={new UDim(0, 16)} />
          <StatBarItem label="BUDGET" value={`$${math.floor(sn.money)}`}
            color={sn.money > 50 ? C.green : C.red} />
          <StatBarItem label="RPS" value={`${sn.currentRPS.toFixed ? string.format("%.1f", sn.currentRPS) : sn.currentRPS}`}
            color={C.blue} />
          <StatBarItem label="TIME" value={formatTime(sn.elapsedGameTime)} color={C.text} />
          <StatBarItem label="SCORE" value={tostring(sn.score.total)} color={C.accent} />
          <ReputationBar reputation={sn.reputation} />
          <TimeControls snapshot={sn} />
        </frame>
      </frame>

      {/* ── Warning toast stack ───────────────────────────────────── */}
      <frame Key="Warnings" BackgroundTransparency={1}
        Size={new UDim2(0, 360, 0, 200)} Position={new UDim2(0.5, -180, 0, 60)} ZIndex={20}>
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 4)} />
        {props.warnings.map((w) => (
          <WarningToast key={w.id} warning={w} />
        ))}
      </frame>

      {/* ── Left panel: Objectives (survival/mlops) / Sandbox ─────── */}
      {sn.gameMode === "sandbox" ? (
        <SandboxPanel
          sandbox={{
            budget: sn.sandboxBudget,
            rps: sn.currentRPS,
            trafficMix: {
              STATIC: sn.trafficDistribution.STATIC * 100,
              READ: sn.trafficDistribution.READ * 100,
              WRITE: sn.trafficDistribution.WRITE * 100,
              UPLOAD: sn.trafficDistribution.UPLOAD * 100,
              SEARCH: sn.trafficDistribution.SEARCH * 100,
              MALICIOUS: sn.trafficDistribution.MALICIOUS * 100,
            },
            burstCount: sn.burstCount,
            upkeepEnabled: sn.upkeepEnabled,
          }}
        />
      ) : (
        <frame Key="ObjectivesPanel"
          Size={new UDim2(0, 220, 0, 0)} Position={new UDim2(0, 8, 0, 64)}
          AutomaticSize={Enum.AutomaticSize.Y}
          BackgroundColor3={C.panel} BackgroundTransparency={0.2} BorderSizePixel={0}>
          <uicorner CornerRadius={new UDim(0, 6)} />
          <uistroke Color={C.border} Thickness={1} />
          <textlabel Key="Title" Text="OBJECTIVES" Font={Enum.Font.GothamBold} TextScaled
            TextColor3={C.accent} BackgroundTransparency={1}
            Size={new UDim2(1, -12, 0, 28)} Position={new UDim2(0, 6, 0, 4)} />
          <frame Key="Content" BackgroundTransparency={1}
            Size={new UDim2(1, -12, 0, 0)} Position={new UDim2(0, 6, 0, 36)}
            AutomaticSize={Enum.AutomaticSize.Y}>
            <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 4)} />
            <textlabel Key="Line1" Text="• Keep Reputation above 0" Font={Enum.Font.Gotham}
              TextScaled TextColor3={C.text} BackgroundTransparency={1}
              Size={new UDim2(1, 0, 0, 22)} TextXAlignment={Enum.TextXAlignment.Left} />
            <textlabel Key="Line2" Text="• Serve incoming requests" Font={Enum.Font.Gotham}
              TextScaled TextColor3={C.text} BackgroundTransparency={1}
              Size={new UDim2(1, 0, 0, 22)} TextXAlignment={Enum.TextXAlignment.Left} />
            <textlabel Key="Line3" Text="• Block malicious traffic" Font={Enum.Font.Gotham}
              TextScaled TextColor3={C.text} BackgroundTransparency={1}
              Size={new UDim2(1, 0, 0, 22)} TextXAlignment={Enum.TextXAlignment.Left} />
          </frame>
        </frame>
      )}

      {/* ── Right panel: Traffic + Finances ──────────────────────── */}
      <frame Key="RightPanel"
        Size={new UDim2(0, 220, 0, 0)} Position={new UDim2(1, -228, 0, 64)}
        AutomaticSize={Enum.AutomaticSize.Y}
        BackgroundColor3={C.panel} BackgroundTransparency={0.2} BorderSizePixel={0}>
        <uicorner CornerRadius={new UDim(0, 6)} />
        <uistroke Color={C.border} Thickness={1} />
        <frame Key="Inner" BackgroundTransparency={1}
          Size={new UDim2(1, -12, 0, 0)} Position={new UDim2(0, 6, 0, 4)}
          AutomaticSize={Enum.AutomaticSize.Y}>
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 2)} />
          {/* Traffic breakdown */}
          <textlabel Key="TrafficTitle" Text="TRAFFIC" Font={Enum.Font.GothamBold} TextScaled
            TextColor3={C.accent} BackgroundTransparency={1}
            Size={new UDim2(1, 0, 0, 24)} />
          {(["STATIC", "READ", "WRITE", "UPLOAD", "SEARCH", "MALICIOUS"] as const).map((t) => (
            <frame Key={t} BackgroundTransparency={1} Size={new UDim2(1, 0, 0, 18)}>
              <textlabel Key="Name" Text={t} Font={Enum.Font.Gotham} TextScaled
                TextColor3={C.textDim} BackgroundTransparency={1}
                Size={new UDim2(0.55, 0, 1, 0)} TextXAlignment={Enum.TextXAlignment.Left} />
              <textlabel Key="Fail" Text={`✕ ${sn.failures[t]}`} Font={Enum.Font.Gotham} TextScaled
                TextColor3={C.red} BackgroundTransparency={1}
                Size={new UDim2(0.45, 0, 1, 0)} Position={new UDim2(0.55, 0, 0, 0)}
                TextXAlignment={Enum.TextXAlignment.Right} />
            </frame>
          ))}
        </frame>
      </frame>

      {/* ── Bottom toolbar ───────────────────────────────────────── */}
      <ToolbarScreen
        activeTool={sn.activeTool}
        money={sn.money}
        prices={{
          waf: 40, alb: 50, lambda: 60, db: 150, nosql: 80,
          s3: 25, sqs: 45, cache: 60, cdn: 60, apigw: 70,
        }}
      />

    </screengui>
  );
}

export const GameplayHUDScreen = hooked(GameplayHUDComponent);
