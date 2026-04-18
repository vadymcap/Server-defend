// UpgradeIndicator.tsx  –  Game Place client
// Shows a "Tier 2 available" badge above an upgradeable service node.

import Roact from "@rbxts/roact";

const C = {
  panel: Color3.fromRGB(13, 18, 32),
  accent: Color3.fromRGB(0, 220, 170),
  yellow: Color3.fromRGB(220, 180, 60),
  text: Color3.fromRGB(220, 230, 240),
};

export interface UpgradeIndicatorProps {
  serviceId: string;
  /** Screen-space position of the indicator */
  screenPos: Vector2;
  nextTier: number;
  cost: number;
  canAfford: boolean;
  onUpgrade(): void;
}

export function UpgradeIndicator(props: UpgradeIndicatorProps): Roact.Element {
  return (
    <textbutton
      Key={`upgrade_${props.serviceId}`}
      Text={props.canAfford ? `⬆ T${props.nextTier}  $${props.cost}` : `T${props.nextTier}  $${props.cost}`}
      Font={Enum.Font.GothamBold}
      TextScaled
      TextColor3={props.canAfford ? C.accent : C.yellow}
      BackgroundColor3={C.panel}
      BackgroundTransparency={props.canAfford ? 0.1 : 0.4}
      BorderSizePixel={0}
      Size={new UDim2(0, 110, 0, 26)}
      Position={new UDim2(0, props.screenPos.X - 55, 0, props.screenPos.Y - 34)}
      Active={props.canAfford}
      ZIndex={30}
      Event={{ Activated: () => { if (props.canAfford) props.onUpgrade(); } }}
    >
      <uicorner CornerRadius={new UDim(0, 4)} />
      <uistroke Color={props.canAfford ? C.accent : C.yellow} Thickness={1} />
    </textbutton>
  );
}
