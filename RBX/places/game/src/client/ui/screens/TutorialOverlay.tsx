// TutorialOverlay.tsx  –  Game Place client
// Step-by-step guided tutorial modal + highlight overlay.
// Mirrors src/tutorial.js and #tutorial-modal from index.html.

import Roact from "@rbxts/roact";
import { hooked } from "@rbxts/roact-hooked";
import Remotes from "@server-defend/shared/net/Definitions";
import type { TutorialStepState } from "@server-defend/shared/types/GameTypes";

const C = {
  bg: Color3.fromRGB(5, 5, 10),
  panel: Color3.fromRGB(13, 18, 32),
  border: Color3.fromRGB(30, 80, 100),
  accent: Color3.fromRGB(0, 220, 170),
  text: Color3.fromRGB(220, 230, 240),
  textDim: Color3.fromRGB(130, 150, 160),
  hint: Color3.fromRGB(100, 180, 200),
};

export interface TutorialOverlayProps {
  step?: TutorialStepState;
  visible: boolean;
}

function ProgressDot({ filled, current }: { filled: boolean; current: boolean }): Roact.Element {
  return (
    <frame Key={`dot_${filled}`}
      BackgroundColor3={current ? C.accent : filled ? Color3.fromRGB(0, 150, 120) : Color3.fromRGB(40, 50, 60)}
      BorderSizePixel={0}
      Size={current ? new UDim2(0, 16, 0, 8) : new UDim2(0, 8, 0, 8)}>
      <uicorner CornerRadius={new UDim(1, 0)} />
    </frame>
  );
}

function TutorialOverlayComponent(props: TutorialOverlayProps): Roact.Element | undefined {
  if (!props.visible || props.step === undefined) return undefined;

  const step = props.step;
  const isCenter = true; // All steps are centered by default in Roblox port

  function sendNext(): void {
    Remotes.Client.Get("tutorialAction").SendToServer({ action: "next" });
  }

  function sendSkip(): void {
    Remotes.Client.Get("tutorialAction").SendToServer({ action: "skip" });
  }

  return (
    <screengui Key="TutorialGui" ZIndexBehavior={Enum.ZIndexBehavior.Sibling} ResetOnSpawn={false}
      IgnoreGuiInset DisplayOrder={50}>

      {/* Semi-transparent backdrop */}
      <frame Key="Backdrop" Size={new UDim2(1, 0, 1, 0)} BackgroundColor3={C.bg}
        BackgroundTransparency={0.5} BorderSizePixel={0} />

      {/* Tutorial popup card */}
      <frame
        Key="Popup"
        Size={new UDim2(0, 420, 0, 0)}
        Position={new UDim2(0.5, -210, 0.5, -160)}
        AutomaticSize={Enum.AutomaticSize.Y}
        BackgroundColor3={C.panel}
        BackgroundTransparency={0.05}
        BorderSizePixel={0}
        ZIndex={10}
      >
        <uicorner CornerRadius={new UDim(0, 10)} />
        <uistroke Color={C.border} Thickness={2} />

        <frame Key="Inner" BackgroundTransparency={1}
          Size={new UDim2(1, -32, 0, 0)} Position={new UDim2(0, 16, 0, 16)}
          AutomaticSize={Enum.AutomaticSize.Y}>
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 10)} />

          {/* Icon + title row */}
          <frame Key="TitleRow" BackgroundTransparency={1} Size={new UDim2(1, 0, 0, 36)}>
            <textlabel Key="Icon" Text={step.icon} Font={Enum.Font.GothamBold} TextScaled
              TextColor3={C.accent} BackgroundTransparency={1}
              Size={new UDim2(0, 36, 1, 0)} />
            <textlabel Key="Title" Text={step.title} Font={Enum.Font.GothamBold} TextScaled
              TextColor3={C.accent} BackgroundTransparency={1}
              Size={new UDim2(1, -44, 1, 0)} Position={new UDim2(0, 44, 0, 0)}
              TextXAlignment={Enum.TextXAlignment.Left} />
          </frame>

          {/* Step counter */}
          <textlabel Key="StepCounter"
            Text={`Step ${step.stepIndex + 1} of ${step.totalSteps}`}
            Font={Enum.Font.Gotham} TextScaled TextColor3={C.textDim}
            BackgroundTransparency={1} Size={new UDim2(1, 0, 0, 18)} />

          {/* Body text */}
          <textlabel Key="Body" Text={step.text} Font={Enum.Font.Gotham} TextScaled
            TextColor3={C.text} BackgroundTransparency={1}
            Size={new UDim2(1, 0, 0, 60)} TextWrapped />

          {/* Hint */}
          {step.hint !== undefined && (
            <frame Key="HintBox" BackgroundColor3={Color3.fromRGB(10, 30, 40)}
              BackgroundTransparency={0.3} BorderSizePixel={0}
              Size={new UDim2(1, 0, 0, 36)} AutomaticSize={Enum.AutomaticSize.Y}>
              <uicorner CornerRadius={new UDim(0, 6)} />
              <textlabel Key="HintText" Text={`💡 ${step.hint}`} Font={Enum.Font.Gotham}
                TextScaled TextColor3={C.hint} BackgroundTransparency={1}
                Size={new UDim2(1, -12, 0, 0)} Position={new UDim2(0, 6, 0, 4)}
                AutomaticSize={Enum.AutomaticSize.Y} TextWrapped />
            </frame>
          )}

          {/* Progress dots */}
          <frame Key="Progress" BackgroundTransparency={1}
            Size={new UDim2(1, 0, 0, 12)}>
            <uilistlayout FillDirection={Enum.FillDirection.Horizontal}
              HorizontalAlignment={Enum.HorizontalAlignment.Center} Padding={new UDim(0, 4)} />
            {Array.from({ length: step.totalSteps }, (_, i) => (
              <ProgressDot key={tostring(i)} filled={i < step.stepIndex} current={i === step.stepIndex} />
            ))}
          </frame>

          {/* Buttons */}
          <frame Key="Btns" BackgroundTransparency={1} Size={new UDim2(1, 0, 0, 0)}
            AutomaticSize={Enum.AutomaticSize.Y}>
            <uilistlayout FillDirection={Enum.FillDirection.Horizontal}
              HorizontalAlignment={Enum.HorizontalAlignment.Right} Padding={new UDim(0, 8)} />
            <textbutton Key="Skip" Text="SKIP" Font={Enum.Font.Gotham} TextScaled
              TextColor3={C.textDim} BackgroundColor3={C.panel} BackgroundTransparency={0.4}
              BorderSizePixel={0} Size={new UDim2(0, 80, 0, 36)}
              Event={{ Activated: sendSkip }}>
              <uicorner CornerRadius={new UDim(0, 6)} />
            </textbutton>
            {(step.action === "next" || step.action === "finish") && (
              <textbutton Key="Next"
                Text={step.action === "finish" ? "START PLAYING!" : "NEXT →"}
                Font={Enum.Font.GothamBold} TextScaled TextColor3={C.accent}
                BackgroundColor3={Color3.fromRGB(0, 60, 50)} BackgroundTransparency={0.1}
                BorderSizePixel={0} Size={new UDim2(0, 140, 0, 36)}
                Event={{ Activated: sendNext }}>
                <uicorner CornerRadius={new UDim(0, 6)} />
                <uistroke Color={C.accent} Thickness={1} />
              </textbutton>
            )}
          </frame>
        </frame>
      </frame>
    </screengui>
  );
}

export const TutorialOverlay = hooked(TutorialOverlayComponent);
