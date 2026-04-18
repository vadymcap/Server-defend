// ToolbarScreen.tsx  –  Game Place client
// Bottom toolbar: select/connect/delete/unlink tools + service deploy palette.
// Maps 1:1 to the #toolbar-left and #toolbar-right sections of index.html.

import Roact from "@rbxts/roact";
import { hooked, useState } from "@rbxts/roact-hooked";
import Remotes from "@server-defend/shared/net/Definitions";
import type { ToolType, ServicePriceMap } from "@server-defend/shared/types/GameTypes";
import { SoundPanel } from "./SoundPanel";
import type { SoundCategoryStateMap } from "@server-defend/shared/types/GameTypes";

const C = {
  panel: Color3.fromRGB(13, 18, 32),
  border: Color3.fromRGB(30, 50, 80),
  text: Color3.fromRGB(220, 230, 240),
  textDim: Color3.fromRGB(130, 150, 160),
  accent: Color3.fromRGB(0, 220, 170),
  active: Color3.fromRGB(0, 180, 140),
  disabled: Color3.fromRGB(80, 90, 100),
};

export interface ToolbarProps {
  activeTool: ToolType;
  money: number;
  prices: ServicePriceMap;
}

// ── Utility tool button ─────────────────────────────────────────────────────

interface ToolBtnProps {
  id: ToolType;
  icon: string;
  label: string;
  active: boolean;
  onClick(): void;
}

function ToolBtn(props: ToolBtnProps): Roact.Element {
  return (
    <textbutton
      Key={props.id}
      Text=""
      AutoButtonColor={false}
      Size={new UDim2(0, 60, 0, 60)}
      BackgroundColor3={props.active ? C.active : C.panel}
      BackgroundTransparency={props.active ? 0.1 : 0.3}
      BorderSizePixel={0}
      Event={{ Activated: props.onClick }}
    >
      <uicorner CornerRadius={new UDim(0, 6)} />
      <uistroke Color={props.active ? C.accent : C.border} Thickness={props.active ? 2 : 1} />
      <textlabel Key="Icon" Text={props.icon} Font={Enum.Font.GothamBold}
        TextScaled TextColor3={props.active ? C.accent : C.text}
        BackgroundTransparency={1} Size={new UDim2(1, 0, 0.55, 0)} />
      <textlabel Key="Label" Text={props.label} Font={Enum.Font.Gotham}
        TextScaled TextColor3={C.textDim} BackgroundTransparency={1}
        Size={new UDim2(1, 0, 0.35, 0)} Position={new UDim2(0, 0, 0.62, 0)} />
    </textbutton>
  );
}

// ── Service deploy button ────────────────────────────────────────────────────

interface ServiceBtnProps {
  toolId: ToolType;
  icon: string;
  label: string;
  cost: number;
  canAfford: boolean;
  active: boolean;
  onClick(): void;
}

function ServiceBtn(props: ServiceBtnProps): Roact.Element {
  return (
    <textbutton
      Key={props.toolId}
      Text=""
      AutoButtonColor={false}
      Size={new UDim2(0, 72, 0, 68)}
      BackgroundColor3={props.active ? C.active : C.panel}
      BackgroundTransparency={props.active ? 0.1 : 0.3}
      BorderSizePixel={0}
      Active={props.canAfford}
      Event={{ Activated: () => { if (props.canAfford) props.onClick(); } }}
    >
      <uicorner CornerRadius={new UDim(0, 6)} />
      <uistroke
        Color={!props.canAfford ? C.disabled : props.active ? C.accent : C.border}
        Thickness={1}
      />
      <textlabel Key="Icon" Text={props.icon} Font={Enum.Font.GothamBold}
        TextScaled
        TextColor3={props.canAfford ? (props.active ? C.accent : C.text) : C.disabled}
        BackgroundTransparency={1} Size={new UDim2(1, 0, 0.45, 0)} />
      <textlabel Key="Label" Text={props.label} Font={Enum.Font.Gotham}
        TextScaled TextColor3={C.textDim} BackgroundTransparency={1}
        Size={new UDim2(1, 0, 0.28, 0)} Position={new UDim2(0, 0, 0.45, 0)} />
      <textlabel Key="Cost" Text={`$${props.cost}`} Font={Enum.Font.GothamBold}
        TextScaled
        TextColor3={props.canAfford ? Color3.fromRGB(220, 180, 60) : C.disabled}
        BackgroundTransparency={1}
        Size={new UDim2(1, 0, 0.26, 0)} Position={new UDim2(0, 0, 0.73, 0)} />
    </textbutton>
  );
}

// ── Main toolbar ─────────────────────────────────────────────────────────────

function ToolbarComponent(props: ToolbarProps): Roact.Element {
  const [soundPanelOpen, setSoundPanelOpen] = useState(false);

  function selectTool(tool: ToolType): void {
    Remotes.Client.Get("setTool").SendToServer(tool);
  }

  const p = props.prices;

  return (
    <frame
      Key="Toolbar"
      Size={new UDim2(1, 0, 0, 80)}
      Position={new UDim2(0, 0, 1, -80)}
      BackgroundColor3={C.panel}
      BackgroundTransparency={0.1}
      BorderSizePixel={0}
      ZIndex={10}
    >
      <uistroke Color={C.border} Thickness={1} />

      <frame Key="Inner" BackgroundTransparency={1}
        Size={new UDim2(1, -16, 1, 0)} Position={new UDim2(0, 8, 0, 0)}>
        <uilistlayout FillDirection={Enum.FillDirection.Horizontal}
          VerticalAlignment={Enum.VerticalAlignment.Center} Padding={new UDim(0, 6)} />

        {/* Utility tools */}
        <ToolBtn id="select" icon="🖱" label="SELECT" active={props.activeTool === "select"}
          onClick={() => selectTool("select")} />
        <ToolBtn id="connect" icon="🔗" label="LINK" active={props.activeTool === "connect"}
          onClick={() => selectTool("connect")} />
        <ToolBtn id="unlink" icon="✂" label="UNLINK" active={props.activeTool === "unlink"}
          onClick={() => selectTool("unlink")} />
        <ToolBtn id="delete" icon="🗑" label="DELETE" active={props.activeTool === "delete"}
          onClick={() => selectTool("delete")} />

        {/* Divider */}
        <frame Key="Div" BackgroundColor3={C.border} BorderSizePixel={0}
          Size={new UDim2(0, 1, 0.7, 0)} />

        {/* Service deploy palette */}
        <ServiceBtn toolId="waf" icon="🛡" label="FIREWALL" cost={p.waf}
          canAfford={props.money >= p.waf} active={props.activeTool === "waf"}
          onClick={() => selectTool("waf")} />
        <ServiceBtn toolId="alb" icon="⚖" label="LOAD BAL" cost={p.alb}
          canAfford={props.money >= p.alb} active={props.activeTool === "alb"}
          onClick={() => selectTool("alb")} />
        <ServiceBtn toolId="lambda" icon="⚡" label="COMPUTE" cost={p.lambda}
          canAfford={props.money >= p.lambda} active={props.activeTool === "lambda"}
          onClick={() => selectTool("lambda")} />
        <ServiceBtn toolId="db" icon="🗄" label="SQL DB" cost={p.db}
          canAfford={props.money >= p.db} active={props.activeTool === "db"}
          onClick={() => selectTool("db")} />
        <ServiceBtn toolId="nosql" icon="📦" label="NOSQL" cost={p.nosql}
          canAfford={props.money >= p.nosql} active={props.activeTool === "nosql"}
          onClick={() => selectTool("nosql")} />
        <ServiceBtn toolId="s3" icon="📁" label="STORAGE" cost={p.s3}
          canAfford={props.money >= p.s3} active={props.activeTool === "s3"}
          onClick={() => selectTool("s3")} />
        <ServiceBtn toolId="sqs" icon="📬" label="QUEUE" cost={p.sqs}
          canAfford={props.money >= p.sqs} active={props.activeTool === "sqs"}
          onClick={() => selectTool("sqs")} />
        <ServiceBtn toolId="cache" icon="⚡" label="CACHE" cost={p.cache}
          canAfford={props.money >= p.cache} active={props.activeTool === "cache"}
          onClick={() => selectTool("cache")} />
        <ServiceBtn toolId="cdn" icon="🌍" label="CDN" cost={p.cdn}
          canAfford={props.money >= p.cdn} active={props.activeTool === "cdn"}
          onClick={() => selectTool("cdn")} />
        <ServiceBtn toolId="apigw" icon="🚪" label="API GW" cost={p.apigw}
          canAfford={props.money >= p.apigw} active={props.activeTool === "apigw"}
          onClick={() => selectTool("apigw")} />

        {/* Spacer */}
        <frame Key="Spacer" BackgroundTransparency={1} Size={new UDim2(1, 0, 0, 0)} />

        {/* Sound button */}
        <textbutton Key="SoundBtn" Text="🔊" Font={Enum.Font.GothamBold} TextScaled
          TextColor3={C.accent} BackgroundColor3={C.panel} BackgroundTransparency={0.3}
          BorderSizePixel={0} Size={new UDim2(0, 48, 0, 48)}
          Event={{ Activated: () => setSoundPanelOpen((v) => !v) }}>
          <uicorner CornerRadius={new UDim(0, 6)} />
        </textbutton>
      </frame>

      {/* Sound panel popover */}
      {soundPanelOpen && (
        <SoundPanel
          visible={soundPanelOpen}
          categories={{
            master: { vol: 1, on: true },
            bgm: { vol: 0.5, on: true },
            ui: { vol: 0.8, on: true },
            events: { vol: 1, on: true },
            gameplay: { vol: 0.8, on: true },
          }}
        />
      )}
    </frame>
  );
}

export const ToolbarScreen = hooked(ToolbarComponent);
