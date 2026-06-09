// MainMenuScreen.tsx  –  Main Place
// Mirrors the main-menu-modal from index.html:
//   - Mode selector (Survival / Sandbox / MLOps)
//   - Play / Resume / Load / Settings / Credits buttons
//   - Fires sessionInit / sessionResume / sessionLoad remotes

import Roact from "@rbxts/roact";
import { hooked, useState } from "@rbxts/roact-hooked";
import Remotes from "@server-defend/shared/net/Definitions";
import type { GameMode } from "@server-defend/shared/types/GameTypes";
import type { MainMenuProps, MainMenuPanel } from "./types";

// ── Colour palette (matches Tailwind classes in original) ──────────────────
const C = {
  bg: Color3.fromRGB(8, 10, 20),
  panel: Color3.fromRGB(15, 20, 35),
  border: Color3.fromRGB(30, 50, 80),
  accent: Color3.fromRGB(0, 220, 170),
  accentDim: Color3.fromRGB(0, 150, 120),
  text: Color3.fromRGB(220, 230, 240),
  textDim: Color3.fromRGB(130, 150, 160),
  danger: Color3.fromRGB(220, 50, 50),
  survival: Color3.fromRGB(60, 180, 100),
  sandbox: Color3.fromRGB(60, 130, 220),
  mlops: Color3.fromRGB(160, 80, 220),
};

// ── Sub-components ─────────────────────────────────────────────────────────

interface ModeCardProps {
  mode: GameMode;
  label: string;
  desc: string;
  color: Color3;
  selected: boolean;
  onSelect(): void;
}

function ModeCard(props: ModeCardProps): Roact.Element {
  return (
    <textbutton
      Key={props.mode}
      Text=""
      AutoButtonColor={false}
      Size={new UDim2(1, 0, 0, 100)}
      BackgroundColor3={props.selected ? props.color : C.panel}
      BackgroundTransparency={props.selected ? 0.7 : 0.2}
      BorderSizePixel={0}
      Event={{ Activated: props.onSelect }}
    >
      <uicorner CornerRadius={new UDim(0, 8)} />
      <uistroke Color={props.selected ? props.color : C.border} Thickness={2} />
      <textlabel
        Key="Label"
        Text={props.label}
        Font={Enum.Font.GothamBold}
        TextScaled
        TextColor3={props.selected ? props.color : C.text}
        BackgroundTransparency={1}
        Size={new UDim2(1, -16, 0, 28)}
        Position={new UDim2(0, 8, 0, 10)}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <textlabel
        Key="Desc"
        Text={props.desc}
        Font={Enum.Font.Gotham}
        TextScaled
        TextColor3={C.textDim}
        BackgroundTransparency={1}
        Size={new UDim2(1, -16, 0, 50)}
        Position={new UDim2(0, 8, 0, 44)}
        TextXAlignment={Enum.TextXAlignment.Left}
        TextWrapped
      />
    </textbutton>
  );
}

interface MenuButtonProps {
  text: string;
  color: Color3;
  onClick(): void;
  disabled?: boolean;
}

function MenuButton(props: MenuButtonProps): Roact.Element {
  return (
    <textbutton
      Key={props.text}
      Text={props.text}
      Font={Enum.Font.GothamBold}
      TextScaled
      TextColor3={props.disabled ? C.textDim : props.color}
      AutoButtonColor
      Size={new UDim2(1, 0, 0, 44)}
      BackgroundColor3={C.panel}
      BackgroundTransparency={0.3}
      BorderSizePixel={0}
      Active={!props.disabled}
      Event={{ Activated: () => { if (!props.disabled) props.onClick(); } }}
    >
      <uicorner CornerRadius={new UDim(0, 6)} />
      <uistroke Color={props.disabled ? C.border : props.color} Thickness={1} />
    </textbutton>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

function MainMenuScreenComponent(props: MainMenuProps): Roact.Element {
  const [selectedMode, setSelectedMode] = useState<GameMode>("survival");
  const [panel, setPanel] = useState<MainMenuPanel>("root");

  function handlePlay(): void {
    Remotes.Client.Get("sessionInit").SendToServer({ mode: selectedMode });
  }

  function handleResume(): void {
    Remotes.Client.Get("sessionResume").SendToServer();
  }

  function handleLoad(): void {
    Remotes.Client.Get("sessionLoad").SendToServer("slot1");
  }

  if (panel === "settings") {
    return (
      <screengui Key="MainMenuGui" ZIndexBehavior={Enum.ZIndexBehavior.Sibling} ResetOnSpawn={false} IgnoreGuiInset>
        <frame Key="Overlay" Size={new UDim2(1, 0, 1, 0)} BackgroundColor3={C.bg} BackgroundTransparency={0.1} BorderSizePixel={0}>
          <textlabel Key="Title" Text="SETTINGS" Font={Enum.Font.GothamBold} TextScaled TextColor3={C.accent}
            BackgroundTransparency={1} Size={new UDim2(0.5, 0, 0.08, 0)} Position={new UDim2(0.25, 0, 0.1, 0)} />
          <textlabel Key="Note" Text="Sound and locale settings are available in-game via the Sound Panel." Font={Enum.Font.Gotham}
            TextScaled TextColor3={C.textDim} BackgroundTransparency={1} Size={new UDim2(0.5, 0, 0.06, 0)}
            Position={new UDim2(0.25, 0, 0.25, 0)} TextWrapped />
          <textbutton Key="Back" Text="← BACK" Font={Enum.Font.GothamBold} TextScaled TextColor3={C.accent}
            BackgroundColor3={C.panel} BackgroundTransparency={0.3} BorderSizePixel={0}
            Size={new UDim2(0.2, 0, 0.06, 0)} Position={new UDim2(0.4, 0, 0.7, 0)}
            Event={{ Activated: () => setPanel("root") }}>
            <uicorner CornerRadius={new UDim(0, 6)} />
          </textbutton>
        </frame>
      </screengui>
    );
  }

  if (panel === "credits") {
    return (
      <screengui Key="MainMenuGui" ZIndexBehavior={Enum.ZIndexBehavior.Sibling} ResetOnSpawn={false} IgnoreGuiInset>
        <frame Key="Overlay" Size={new UDim2(1, 0, 1, 0)} BackgroundColor3={C.bg} BackgroundTransparency={0.1} BorderSizePixel={0}>
          <textlabel Key="Title" Text="CREDITS" Font={Enum.Font.GothamBold} TextScaled TextColor3={C.accent}
            BackgroundTransparency={1} Size={new UDim2(0.5, 0, 0.08, 0)} Position={new UDim2(0.25, 0, 0.1, 0)} />
          <textlabel Key="Body"
            Text={"Server Defend\n\nOriginal browser game by vadymcap\nRoblox port built with roblox-ts, Roact and @rbxts/net\n\nMusic & SFX: original assets"}
            Font={Enum.Font.Gotham} TextScaled TextColor3={C.text} BackgroundTransparency={1}
            Size={new UDim2(0.5, 0, 0.3, 0)} Position={new UDim2(0.25, 0, 0.25, 0)} TextWrapped />
          <textbutton Key="Back" Text="← BACK" Font={Enum.Font.GothamBold} TextScaled TextColor3={C.accent}
            BackgroundColor3={C.panel} BackgroundTransparency={0.3} BorderSizePixel={0}
            Size={new UDim2(0.2, 0, 0.06, 0)} Position={new UDim2(0.4, 0, 0.7, 0)}
            Event={{ Activated: () => setPanel("root") }}>
            <uicorner CornerRadius={new UDim(0, 6)} />
          </textbutton>
        </frame>
      </screengui>
    );
  }

  // Root panel
  return (
    <screengui Key="MainMenuGui" ZIndexBehavior={Enum.ZIndexBehavior.Sibling} ResetOnSpawn={false} IgnoreGuiInset>
      {/* Dark background */}
      <frame Key="Bg" Size={new UDim2(1, 0, 1, 0)} BackgroundColor3={C.bg} BackgroundTransparency={0.05} BorderSizePixel={0} />

      {/* Card */}
      <frame
        Key="Card"
        Size={new UDim2(0, 480, 0, 640)}
        Position={new UDim2(0.5, -240, 0.5, -320)}
        BackgroundColor3={C.panel}
        BackgroundTransparency={0.1}
        BorderSizePixel={0}
      >
        <uicorner CornerRadius={new UDim(0, 12)} />
        <uistroke Color={C.border} Thickness={2} />

        {/* Title */}
        <textlabel
          Key="Title"
          Text="SERVER DEFEND"
          Font={Enum.Font.GothamBold}
          TextScaled
          TextColor3={C.accent}
          BackgroundTransparency={1}
          Size={new UDim2(1, -32, 0, 48)}
          Position={new UDim2(0, 16, 0, 16)}
          TextXAlignment={Enum.TextXAlignment.Center}
        />

        {/* Mode selector */}
        <textlabel Key="ModeLabel" Text="SELECT MODE" Font={Enum.Font.GothamBold} TextScaled
          TextColor3={C.textDim} BackgroundTransparency={1}
          Size={new UDim2(1, -32, 0, 20)} Position={new UDim2(0, 16, 0, 74)} />

        <frame Key="Modes" Size={new UDim2(1, -32, 0, 320)} Position={new UDim2(0, 16, 0, 98)} BackgroundTransparency={1}>
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 8)} />
          <ModeCard mode="survival" label="⚔ SURVIVAL" desc="Escalating traffic. Manage upkeep, handle random events, keep reputation above 0."
            color={C.survival} selected={selectedMode === "survival"} onSelect={() => setSelectedMode("survival")} />
          <ModeCard mode="sandbox" label="🧪 SANDBOX" desc="Free build with unlimited budget. Test architectures and traffic mixes freely."
            color={C.sandbox} selected={selectedMode === "sandbox"} onSelect={() => setSelectedMode("sandbox")} />
          <ModeCard mode="mlops" label="🤖 MLOPS" desc="Run an ML serving platform. Manage cold starts, model drift and training pipelines."
            color={C.mlops} selected={selectedMode === "mlops"} onSelect={() => setSelectedMode("mlops")} />
        </frame>

        {/* Action buttons */}
        <frame Key="Buttons" Size={new UDim2(1, -32, 0, 200)} Position={new UDim2(0, 16, 0, 430)} BackgroundTransparency={1}>
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 8)} />
          <MenuButton text="▶  PLAY" color={C.accent} onClick={handlePlay} />
          {props.canResume && <MenuButton text="⟳  RESUME" color={C.accentDim} onClick={handleResume} />}
          {props.hasSave && <MenuButton text="📂  CONTINUE" color={C.sandbox} onClick={handleLoad} />}
          <MenuButton text="⚙  SETTINGS" color={C.textDim} onClick={() => setPanel("settings")} />
          <MenuButton text="ℹ  CREDITS" color={C.textDim} onClick={() => setPanel("credits")} />
        </frame>
      </frame>
    </screengui>
  );
}

export const MainMenuScreen = hooked(MainMenuScreenComponent);
