// FAQModal.tsx  –  Game Place client
// Mirrors #faq-modal from index.html with tabs:
//   Traffic / Services / Tools / Mechanics

import Roact from "@rbxts/roact";
import { hooked, useState } from "@rbxts/roact-hooked";
import type { GameMode } from "@server-defend/shared/types/GameTypes";
import { SERVICE_CONFIG } from "@server-defend/shared/config/GameConfig";

const C = {
  panel: Color3.fromRGB(13, 18, 32),
  border: Color3.fromRGB(30, 50, 80),
  accent: Color3.fromRGB(0, 220, 170),
  text: Color3.fromRGB(220, 230, 240),
  textDim: Color3.fromRGB(130, 150, 160),
};

export interface FAQModalProps {
  visible: boolean;
  mode: GameMode;
  onClose(): void;
}

type Tab = "traffic" | "services" | "tools" | "mechanics";

const TABS: { id: Tab; label: string }[] = [
  { id: "traffic", label: "Traffic" },
  { id: "services", label: "Services" },
  { id: "tools", label: "Tools" },
  { id: "mechanics", label: "Mechanics" },
];

interface FaqCardProps { title: string; desc: string; color: Color3 }
function FaqCard({ title, desc, color }: FaqCardProps): Roact.Element {
  return (
    <frame Key={title} BackgroundColor3={Color3.fromRGB(15, 22, 40)} BackgroundTransparency={0.2}
      BorderSizePixel={0} Size={new UDim2(1, 0, 0, 0)} AutomaticSize={Enum.AutomaticSize.Y}>
      <uicorner CornerRadius={new UDim(0, 6)} />
      <uistroke Color={C.border} Thickness={1} />
      <textlabel Key="Title" Text={title} Font={Enum.Font.GothamBold} TextScaled
        TextColor3={color} BackgroundTransparency={1}
        Size={new UDim2(1, -12, 0, 22)} Position={new UDim2(0, 6, 0, 4)} />
      <textlabel Key="Desc" Text={desc} Font={Enum.Font.Gotham} TextScaled
        TextColor3={C.textDim} BackgroundTransparency={1}
        Size={new UDim2(1, -12, 0, 0)} Position={new UDim2(0, 6, 0, 28)}
        AutomaticSize={Enum.AutomaticSize.Y} TextWrapped />
    </frame>
  );
}

function renderTab(tab: Tab, mode: GameMode): Roact.Element[] {
  if (mode === "mlops") {
    if (tab === "traffic") return [
      <FaqCard title="REALTIME" desc="Latency-sensitive inference. Warm endpoints or pay cold-start penalty." color={Color3.fromRGB(60,130,220)} />,
      <FaqCard title="TRAIN" desc="Retraining jobs. Queue safely but delay causes model drift." color={Color3.fromRGB(220,130,60)} />,
      <FaqCard title="BATCH" desc="Offline inference bursts. Expensive upkeep if left on." color={Color3.fromRGB(60,200,100)} />,
      <FaqCard title="ADVERSARIAL" desc="Poisoned inputs. Let through = reputation drain." color={Color3.fromRGB(220,60,60)} />,
    ];
    if (tab === "mechanics") return [
      <FaqCard title="Cold Starts" desc="Idle endpoints go cold after 12s. Next request pays +8s penalty." color={C.accent} />,
      <FaqCard title="Model Drift" desc="Endpoints lose health over time. Below 70% serving costs extra reputation." color={Color3.fromRGB(220,180,60)} />,
      <FaqCard title="Retraining" desc="TRAIN on Training Cluster repairs model health across serving fleet." color={Color3.fromRGB(60,200,100)} />,
    ];
  }

  if (tab === "traffic") return [
    <FaqCard title="STATIC" desc="GET requests for static files. 90% cache hit rate. Destination: CDN/S3." color={Color3.fromRGB(60,200,100)} />,
    <FaqCard title="READ" desc="GET from database. 40% cache hit. Destination: DB." color={Color3.fromRGB(60,130,220)} />,
    <FaqCard title="WRITE" desc="POST/PUT to database. Not cacheable. Destination: DB." color={Color3.fromRGB(220,130,60)} />,
    <FaqCard title="UPLOAD" desc="File upload. Heavy (2x weight). Destination: S3." color={Color3.fromRGB(220,180,60)} />,
    <FaqCard title="SEARCH" desc="Query database. Heaviest (2.5x). 15% cache. SQL only." color={Color3.fromRGB(0,200,220)} />,
    <FaqCard title="MALICIOUS" desc="DDoS / attack traffic. Block with Firewall or pay reputation." color={Color3.fromRGB(220,60,60)} />,
  ];

  if (tab === "services") return [
    <FaqCard title={`Firewall – $${SERVICE_CONFIG.waf.cost}`} desc="Blocks malicious traffic. First line of defense." color={Color3.fromRGB(160,80,220)} />,
    <FaqCard title={`Load Balancer – $${SERVICE_CONFIG.alb.cost}`} desc="Distributes traffic across Compute nodes." color={Color3.fromRGB(60,130,220)} />,
    <FaqCard title={`Compute – $${SERVICE_CONFIG.compute.cost}`} desc="Processes requests. Upgradeable." color={Color3.fromRGB(220,130,60)} />,
    <FaqCard title={`SQL DB – $${SERVICE_CONFIG.db.cost}`} desc="READ/WRITE/SEARCH destination. Upgradeable." color={Color3.fromRGB(220,60,60)} />,
    <FaqCard title={`NoSQL DB – $${SERVICE_CONFIG.nosql.cost}`} desc="Faster READ/WRITE, no SEARCH support. Upgradeable." color={Color3.fromRGB(120,60,220)} />,
    <FaqCard title={`Storage – $${SERVICE_CONFIG.s3.cost}`} desc="STATIC/UPLOAD destination." color={Color3.fromRGB(60,200,120)} />,
    <FaqCard title={`Queue – $${SERVICE_CONFIG.sqs.cost}`} desc="Buffers requests during spikes." color={Color3.fromRGB(220,150,60)} />,
    <FaqCard title={`Cache – $${SERVICE_CONFIG.cache.cost}`} desc="Reduces DB load. Upgradeable hit rate." color={Color3.fromRGB(220,60,60)} />,
    <FaqCard title={`CDN – $${SERVICE_CONFIG.cdn.cost}`} desc="95% cache hit for STATIC. Low upkeep." color={Color3.fromRGB(60,200,80)} />,
    <FaqCard title={`API Gateway – $${SERVICE_CONFIG.apigw.cost}`} desc="Rate limits traffic. Throttle > hard fail. Upgradeable." color={Color3.fromRGB(220,120,240)} />,
  ];

  if (tab === "tools") return [
    <FaqCard title="SELECT" desc="Click a node to inspect queue depth, tier, health." color={C.accent} />,
    <FaqCard title="LINK" desc="Draw connections between nodes. Click source then target." color={C.accent} />,
    <FaqCard title="UNLINK" desc="Remove connections. Click source then target." color={Color3.fromRGB(220,180,60)} />,
    <FaqCard title="DELETE" desc="Remove a service node and all its connections." color={Color3.fromRGB(220,60,60)} />,
  ];

  if (tab === "mechanics") return [
    <FaqCard title="Service Degradation" desc="Services lose health under load. Critical health reduces capacity. Repair manually or enable auto-repair." color={Color3.fromRGB(220,180,60)} />,
    <FaqCard title="Random Events" desc="Cost Spike, Traffic Burst, Capacity Drop, Service Outage – handle fast!" color={Color3.fromRGB(220,60,60)} />,
    <FaqCard title="Traffic Shifts" desc="Traffic type distribution changes periodically. Adapt your topology." color={C.accent} />,
    <FaqCard title="Upkeep Scaling" desc="Upkeep costs grow over time up to 2x. Budget planning is key." color={Color3.fromRGB(220,130,60)} />,
  ];

  return [];
}

function FAQModalComponent(props: FAQModalProps): Roact.Element | undefined {
  if (!props.visible) return undefined;
  const [tab, setTab] = useState<Tab>("traffic");

  return (
    <screengui Key="FAQGui" ZIndexBehavior={Enum.ZIndexBehavior.Sibling} ResetOnSpawn={false}
      IgnoreGuiInset DisplayOrder={30}>
      <frame Key="Backdrop" Size={new UDim2(1, 0, 1, 0)} BackgroundColor3={Color3.fromRGB(5, 5, 10)}
        BackgroundTransparency={0.4} BorderSizePixel={0} />

      <frame Key="Card"
        Size={new UDim2(0, 540, 0, 600)} Position={new UDim2(0.5, -270, 0.5, -300)}
        BackgroundColor3={C.panel} BackgroundTransparency={0.05} BorderSizePixel={0} ZIndex={5}>
        <uicorner CornerRadius={new UDim(0, 10)} />
        <uistroke Color={C.border} Thickness={2} />

        {/* Header */}
        <textlabel Key="Title" Text="📖 GAME MANUAL" Font={Enum.Font.GothamBold} TextScaled
          TextColor3={C.accent} BackgroundTransparency={1}
          Size={new UDim2(1, -60, 0, 40)} Position={new UDim2(0, 16, 0, 8)} />
        <textbutton Key="Close" Text="✕" Font={Enum.Font.GothamBold} TextScaled
          TextColor3={C.textDim} BackgroundTransparency={1} BorderSizePixel={0}
          Size={new UDim2(0, 40, 0, 40)} Position={new UDim2(1, -48, 0, 4)}
          Event={{ Activated: props.onClose }} />

        {/* Tabs */}
        <frame Key="Tabs" BackgroundTransparency={1}
          Size={new UDim2(1, -32, 0, 36)} Position={new UDim2(0, 16, 0, 52)}>
          <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, 6)} />
          {TABS.map((t) => (
            <textbutton Key={t.id} Text={t.label} Font={Enum.Font.GothamBold} TextScaled
              TextColor3={tab === t.id ? C.accent : C.textDim}
              BackgroundColor3={tab === t.id ? Color3.fromRGB(10, 40, 50) : C.panel}
              BackgroundTransparency={0.2} BorderSizePixel={0}
              Size={new UDim2(0, 110, 1, 0)}
              Event={{ Activated: () => setTab(t.id) }}>
              <uicorner CornerRadius={new UDim(0, 4)} />
              <uistroke Color={tab === t.id ? C.accent : C.border} Thickness={1} />
            </textbutton>
          ))}
        </frame>

        {/* Content scroll */}
        <scrollingframe Key="Content"
          Size={new UDim2(1, -32, 1, -104)} Position={new UDim2(0, 16, 0, 96)}
          BackgroundTransparency={1} BorderSizePixel={0}
          ScrollBarThickness={4} CanvasSize={new UDim2(0, 0, 0, 0)}
          AutomaticCanvasSize={Enum.AutomaticSize.Y}>
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 8)} />
          {renderTab(tab, props.mode)}
        </scrollingframe>
      </frame>
    </screengui>
  );
}

export const FAQModal = hooked(FAQModalComponent);
