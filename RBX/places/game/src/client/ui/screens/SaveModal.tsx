// SaveModal.tsx  –  Game Place client
// Slot-based save and load modal.

import Roact from "@rbxts/roact";
import { hooked, useState, useEffect } from "@rbxts/roact-hooked";
import Remotes from "@server-defend/shared/net/Definitions";

const C = {
  panel: Color3.fromRGB(13, 18, 32),
  border: Color3.fromRGB(30, 50, 80),
  accent: Color3.fromRGB(0, 220, 170),
  text: Color3.fromRGB(220, 230, 240),
  textDim: Color3.fromRGB(130, 150, 160),
  green: Color3.fromRGB(60, 200, 100),
  red: Color3.fromRGB(220, 60, 60),
};

export interface SaveModalProps {
  visible: boolean;
  onClose(): void;
}

const SLOTS = ["slot1", "slot2", "slot3"];

function SaveModalComponent(props: SaveModalProps): Roact.Element | undefined {
  if (!props.visible) return undefined;

  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const promise = Remotes.Client.Get("listSaveSlots").CallServerAsync();
    promise.andThen((list) => setSlots(list));
  }, []);

  function doSave(slot: string): void {
    setSaving(true);
    // Saving is triggered server-side by requesting current state snapshot
    Remotes.Client.Get("saveSlotWrite").SendToServer({
      slot,
      // Actual data is assembled server-side; client just names the slot
      data: {} as never,
    });
    task.delay(0.8, () => {
      setSaving(false);
      setFeedback(`Saved to ${slot}!`);
      setSlots((prev) => (prev.includes(slot) ? prev : [...prev, slot]));
    });
  }

  function doLoad(slot: string): void {
    Remotes.Client.Get("sessionLoad").SendToServer(slot);
    props.onClose();
  }

  return (
    <screengui Key="SaveGui" ZIndexBehavior={Enum.ZIndexBehavior.Sibling} ResetOnSpawn={false}
      IgnoreGuiInset DisplayOrder={25}>
      <frame Key="Backdrop" Size={new UDim2(1, 0, 1, 0)}
        BackgroundColor3={Color3.fromRGB(5, 5, 10)} BackgroundTransparency={0.5}
        BorderSizePixel={0} />

      <frame Key="Card"
        Size={new UDim2(0, 420, 0, 400)} Position={new UDim2(0.5, -210, 0.5, -200)}
        BackgroundColor3={C.panel} BackgroundTransparency={0.05} BorderSizePixel={0} ZIndex={5}>
        <uicorner CornerRadius={new UDim(0, 10)} />
        <uistroke Color={C.border} Thickness={2} />

        <textlabel Key="Title" Text="💾 SAVE / LOAD" Font={Enum.Font.GothamBold} TextScaled
          TextColor3={C.accent} BackgroundTransparency={1}
          Size={new UDim2(1, -60, 0, 40)} Position={new UDim2(0, 16, 0, 8)} />

        <textbutton Key="Close" Text="✕" Font={Enum.Font.GothamBold} TextScaled
          TextColor3={C.textDim} BackgroundTransparency={1} BorderSizePixel={0}
          Size={new UDim2(0, 40, 0, 40)} Position={new UDim2(1, -48, 0, 4)}
          Event={{ Activated: props.onClose }} />

        <frame Key="Slots" BackgroundTransparency={1}
          Size={new UDim2(1, -32, 0, 260)} Position={new UDim2(0, 16, 0, 56)}>
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 10)} />
          {SLOTS.map((slot) => {
            const hasSave = slots.includes(slot);
            return (
              <frame Key={slot} BackgroundTransparency={1} Size={new UDim2(1, 0, 0, 64)}>
                <textlabel Key="SlotName" Text={slot.upper()} Font={Enum.Font.GothamBold} TextScaled
                  TextColor3={hasSave ? C.accent : C.textDim} BackgroundTransparency={1}
                  Size={new UDim2(0.35, 0, 1, 0)} />
                <textlabel Key="Status" Text={hasSave ? "● SAVED" : "○ EMPTY"}
                  Font={Enum.Font.Gotham} TextScaled
                  TextColor3={hasSave ? C.green : C.textDim} BackgroundTransparency={1}
                  Size={new UDim2(0.3, 0, 1, 0)} Position={new UDim2(0.35, 0, 0, 0)} />
                <textbutton Key="Save" Text="SAVE" Font={Enum.Font.GothamBold} TextScaled
                  TextColor3={saving ? C.textDim : C.green}
                  BackgroundColor3={Color3.fromRGB(20, 50, 30)} BackgroundTransparency={0.3}
                  BorderSizePixel={0} Size={new UDim2(0.15, 0, 0.7, 0)}
                  Position={new UDim2(0.65, 0, 0.15, 0)}
                  Active={!saving}
                  Event={{ Activated: () => { if (!saving) doSave(slot); } }}>
                  <uicorner CornerRadius={new UDim(0, 4)} />
                </textbutton>
                {hasSave && (
                  <textbutton Key="Load" Text="LOAD" Font={Enum.Font.GothamBold} TextScaled
                    TextColor3={C.accent}
                    BackgroundColor3={Color3.fromRGB(10, 40, 50)} BackgroundTransparency={0.3}
                    BorderSizePixel={0} Size={new UDim2(0.15, 0, 0.7, 0)}
                    Position={new UDim2(0.82, 0, 0.15, 0)}
                    Event={{ Activated: () => doLoad(slot) }}>
                    <uicorner CornerRadius={new UDim(0, 4)} />
                  </textbutton>
                )}
              </frame>
            );
          })}
        </frame>

        {feedback !== "" && (
          <textlabel Key="Feedback" Text={feedback} Font={Enum.Font.GothamBold} TextScaled
            TextColor3={C.green} BackgroundTransparency={1}
            Size={new UDim2(1, -32, 0, 30)} Position={new UDim2(0, 16, 0, 326)}
            TextXAlignment={Enum.TextXAlignment.Center} />
        )}
      </frame>
    </screengui>
  );
}

export const SaveModal = hooked(SaveModalComponent);
