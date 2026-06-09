// GameOverScreen.tsx  –  Game Place client
// Mirrors the #modal / failure analysis panel from index.html.

import Roact from "@rbxts/roact";
import { hooked } from "@rbxts/roact-hooked";
import type { FailureAnalysisPayload } from "@server-defend/shared/types/GameTypes";
import { formatTime } from "@server-defend/shared/util/MathUtil";

const C = {
  bg: Color3.fromRGB(5, 5, 10),
  panel: Color3.fromRGB(13, 18, 32),
  border: Color3.fromRGB(60, 30, 30),
  accent: Color3.fromRGB(0, 220, 170),
  text: Color3.fromRGB(220, 230, 240),
  textDim: Color3.fromRGB(130, 150, 160),
  red: Color3.fromRGB(220, 60, 60),
  yellow: Color3.fromRGB(220, 180, 60),
  green: Color3.fromRGB(60, 200, 100),
};

export interface GameOverModalProps {
  result?: FailureAnalysisPayload;
  onRetrySame(): void;
  onRestartFresh(): void;
}

interface ActionBtnProps { text: string; color: Color3; onClick(): void; }
function ActionBtn(p: ActionBtnProps): Roact.Element {
  return (
    <textbutton Key={p.text} Text={p.text} Font={Enum.Font.GothamBold} TextScaled
      TextColor3={p.color} AutoButtonColor BackgroundColor3={C.panel}
      BackgroundTransparency={0.3} BorderSizePixel={0}
      Size={new UDim2(1, 0, 0, 44)} Event={{ Activated: p.onClick }}>
      <uicorner CornerRadius={new UDim(0, 6)} />
      <uistroke Color={p.color} Thickness={1} />
    </textbutton>
  );
}

function GameOverComponent(props: GameOverModalProps): Roact.Element {
  const r = props.result;

  return (
    <screengui Key="GameOverGui" ZIndexBehavior={Enum.ZIndexBehavior.Sibling} ResetOnSpawn={false} IgnoreGuiInset>
      <frame Key="Backdrop" Size={new UDim2(1, 0, 1, 0)} BackgroundColor3={C.bg}
        BackgroundTransparency={0.4} BorderSizePixel={0} />

      <frame Key="Card"
        Size={new UDim2(0, 480, 0, 560)}
        Position={new UDim2(0.5, -240, 0.5, -280)}
        BackgroundColor3={C.panel} BackgroundTransparency={0.05}
        BorderSizePixel={0} ZIndex={2}>
        <uicorner CornerRadius={new UDim(0, 12)} />
        <uistroke Color={C.border} Thickness={2} />

        {/* Title */}
        <textlabel Key="Title" Text="💥 SERVER DOWN" Font={Enum.Font.GothamBold} TextScaled
          TextColor3={C.red} BackgroundTransparency={1}
          Size={new UDim2(1, -32, 0, 48)} Position={new UDim2(0, 16, 0, 16)}
          TextXAlignment={Enum.TextXAlignment.Center} />

        {r && (
          <>
            {/* Reason */}
            <textlabel Key="Reason" Text={r.reason} Font={Enum.Font.GothamBold} TextScaled
              TextColor3={C.yellow} BackgroundTransparency={1}
              Size={new UDim2(1, -32, 0, 28)} Position={new UDim2(0, 16, 0, 72)}
              TextXAlignment={Enum.TextXAlignment.Center} />

            {/* Description */}
            <textlabel Key="Desc" Text={r.description} Font={Enum.Font.Gotham} TextScaled
              TextColor3={C.textDim} BackgroundTransparency={1}
              Size={new UDim2(1, -32, 0, 42)} Position={new UDim2(0, 16, 0, 104)}
              TextXAlignment={Enum.TextXAlignment.Center} TextWrapped />

            {/* Stats */}
            <frame Key="Stats" BackgroundTransparency={1}
              Size={new UDim2(1, -32, 0, 80)} Position={new UDim2(0, 16, 0, 158)}>
              <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 4)} />
              <textlabel Key="Score" Text={`Score: ${r.score.total}`} Font={Enum.Font.GothamBold}
                TextScaled TextColor3={C.accent} BackgroundTransparency={1}
                Size={new UDim2(1, 0, 0, 24)} />
              <textlabel Key="Time" Text={`Survived: ${formatTime(r.elapsedGameTime)}`}
                Font={Enum.Font.Gotham} TextScaled TextColor3={C.text} BackgroundTransparency={1}
                Size={new UDim2(1, 0, 0, 24)} />
              <textlabel Key="Blocked" Text={`Attacks blocked: ${r.score.maliciousBlocked}`}
                Font={Enum.Font.Gotham} TextScaled TextColor3={C.green} BackgroundTransparency={1}
                Size={new UDim2(1, 0, 0, 24)} />
            </frame>

            {/* Tips */}
            <frame Key="Tips" BackgroundTransparency={1}
              Size={new UDim2(1, -32, 0, 120)} Position={new UDim2(0, 16, 0, 248)}>
              <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 2)} />
              <textlabel Key="TipTitle" Text="TIPS" Font={Enum.Font.GothamBold} TextScaled
                TextColor3={C.yellow} BackgroundTransparency={1} Size={new UDim2(1, 0, 0, 22)} />
              {r.tips.map((tip, i) => (
                <textlabel Key={tostring(i)} Text={`• ${tip}`} Font={Enum.Font.Gotham}
                  TextScaled TextColor3={C.textDim} BackgroundTransparency={1}
                  Size={new UDim2(1, 0, 0, 22)} TextXAlignment={Enum.TextXAlignment.Left}
                  TextWrapped />
              ))}
            </frame>
          </>
        )}

        {/* Buttons */}
        <frame Key="Buttons" BackgroundTransparency={1}
          Size={new UDim2(1, -32, 0, 100)} Position={new UDim2(0, 16, 0, 440)}>
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 8)} />
          <ActionBtn text="⟳ RETRY SAME ARCHITECTURE" color={C.accent} onClick={props.onRetrySame} />
          <ActionBtn text="↺ RESTART FRESH" color={C.yellow} onClick={props.onRestartFresh} />
        </frame>
      </frame>
    </screengui>
  );
}

export const GameOverScreen = hooked(GameOverComponent);
