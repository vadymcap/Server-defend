// LoadingScreen.tsx  –  Main Place
// Animated logo + progress bar that transitions to the Main Menu.

import Roact from "@rbxts/roact";
import { hooked, useState, useEffect } from "@rbxts/roact-hooked";
import type { LoadingScreenProps } from "./types";

function LoadingScreenComponent(props: LoadingScreenProps): Roact.Element {
  const [logoAlpha, setLogoAlpha] = useState(0);
  const [localProgress, setLocalProgress] = useState(props.progress);
  const [fadeOut, setFadeOut] = useState(false);

  // Fade-in logo on mount
  useEffect(() => {
    let alpha = 0;
    const conn = game.GetService("RunService").Heartbeat.Connect((dt) => {
      alpha = math.min(1, alpha + dt * 1.5);
      setLogoAlpha(alpha);
      if (alpha >= 1) conn.Disconnect();
    });
    return () => conn.Disconnect();
  }, []);

  // Drive progress forward (simulated preload)
  useEffect(() => {
    setLocalProgress(props.progress);
    if (props.progress >= 1 && !fadeOut) {
      setFadeOut(true);
      task.delay(0.6, () => props.onComplete());
    }
  }, [props.progress]);

  return (
    <screengui Key="LoadingScreenGui" ZIndexBehavior={Enum.ZIndexBehavior.Sibling} ResetOnSpawn={false} IgnoreGuiInset>
      {/* Dark backdrop */}
      <frame
        Key="Backdrop"
        Size={new UDim2(1, 0, 1, 0)}
        BackgroundColor3={Color3.fromRGB(5, 5, 10)}
        BackgroundTransparency={0}
        BorderSizePixel={0}
      >
        {/* Logo */}
        <textlabel
          Key="Logo"
          Text="SERVER DEFEND"
          Font={Enum.Font.GothamBold}
          TextScaled
          TextColor3={Color3.fromRGB(0, 255, 200)}
          BackgroundTransparency={1}
          Size={new UDim2(0.5, 0, 0.12, 0)}
          Position={new UDim2(0.25, 0, 0.3, 0)}
          TextTransparency={1 - logoAlpha}
        />

        {/* Tagline */}
        <textlabel
          Key="Tagline"
          Text="Build. Connect. Defend."
          Font={Enum.Font.Gotham}
          TextScaled
          TextColor3={Color3.fromRGB(150, 220, 200)}
          BackgroundTransparency={1}
          Size={new UDim2(0.4, 0, 0.05, 0)}
          Position={new UDim2(0.3, 0, 0.44, 0)}
          TextTransparency={1 - logoAlpha}
        />

        {/* Progress bar track */}
        <frame
          Key="BarTrack"
          Size={new UDim2(0.5, 0, 0.014, 0)}
          Position={new UDim2(0.25, 0, 0.62, 0)}
          BackgroundColor3={Color3.fromRGB(30, 30, 40)}
          BorderSizePixel={0}
        >
          <uicorner CornerRadius={new UDim(1, 0)} />

          {/* Progress fill */}
          <frame
            Key="BarFill"
            Size={new UDim2(localProgress, 0, 1, 0)}
            BackgroundColor3={Color3.fromRGB(0, 220, 170)}
            BorderSizePixel={0}
          >
            <uicorner CornerRadius={new UDim(1, 0)} />
          </frame>
        </frame>

        {/* Status text */}
        <textlabel
          Key="StatusText"
          Text={props.statusText}
          Font={Enum.Font.Gotham}
          TextScaled
          TextColor3={Color3.fromRGB(120, 150, 140)}
          BackgroundTransparency={1}
          Size={new UDim2(0.5, 0, 0.04, 0)}
          Position={new UDim2(0.25, 0, 0.65, 0)}
          TextXAlignment={Enum.TextXAlignment.Center}
        />

        {/* Fade-out overlay */}
        {fadeOut && (
          <frame
            Key="FadeOut"
            Size={new UDim2(1, 0, 1, 0)}
            BackgroundColor3={Color3.fromRGB(5, 5, 10)}
            BackgroundTransparency={0}
            BorderSizePixel={0}
            ZIndex={10}
          />
        )}
      </frame>
    </screengui>
  );
}

export const LoadingScreen = hooked(LoadingScreenComponent);
