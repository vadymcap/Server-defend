// CameraController.ts  –  Game Place client
// Isometric orthographic camera with:
//   - Fixed 45° yaw, ~35.26° pitch
//   - Smooth follow-target
//   - WASD + middle-mouse-drag pan
//   - Scroll-wheel zoom
//   - R → reset, T → top-down/isometric toggle
//   - Rotation-lock toggle

import { RunService, UserInputService, Workspace } from "@rbxts/services";
import { lerp, clamp } from "@server-defend/shared/util/MathUtil";

export interface CameraControllerConfig {
  minZoom: number;
  maxZoom: number;
  zoom: number;
  yawDeg: number;
  pitchDeg: number;
  smoothness: number;
  rotationLocked: boolean;
}

const DEFAULT_CONFIG: CameraControllerConfig = {
  minZoom: 20,
  maxZoom: 180,
  zoom: 80,
  yawDeg: 45,
  pitchDeg: 35.26438968,
  smoothness: 8,
  rotationLocked: true,
};

const DEG2RAD = math.pi / 180;

export class CameraController {
  private config: CameraControllerConfig;
  private camera: Camera;

  /** Current smooth-followed position */
  private currentFocus = new Vector3(0, 0, 0);
  /** Target position we are lerping towards */
  private targetFocus = new Vector3(0, 0, 0);

  private isTopDown = false;

  // Middle-mouse drag
  private isDragging = false;
  private dragStartMouse = new Vector2(0, 0);
  private dragStartFocus = new Vector3(0, 0, 0);

  private connections: RBXScriptConnection[] = [];

  constructor(config?: Partial<CameraControllerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.camera = Workspace.CurrentCamera!;
    this.camera.CameraType = Enum.CameraType.Scriptable;
  }

  // ── Public API ──────────────────────────────────────────────────────────

  /** Start the camera loop. */
  start(): void {
    this.connections.push(
      RunService.RenderStepped.Connect((dt) => this.onRenderStepped(dt)),
    );
    this.connections.push(
      UserInputService.InputBegan.Connect((input, processed) =>
        this.onInputBegan(input, processed),
      ),
    );
    this.connections.push(
      UserInputService.InputEnded.Connect((input) => this.onInputEnded(input)),
    );
    this.connections.push(
      UserInputService.InputChanged.Connect((input) => this.onInputChanged(input)),
    );
  }

  /** Stop and detach all connections. */
  stop(): void {
    for (const conn of this.connections) conn.Disconnect();
    this.connections = [];
  }

  /** Override the pan target. */
  setFocus(pos: Vector3): void {
    this.targetFocus = pos;
  }

  setZoom(zoom: number): void {
    this.config.zoom = clamp(zoom, this.config.minZoom, this.config.maxZoom);
  }

  reset(): void {
    this.targetFocus = new Vector3(0, 0, 0);
    this.config.zoom = DEFAULT_CONFIG.zoom;
    this.isTopDown = false;
  }

  toggleView(): void {
    this.isTopDown = !this.isTopDown;
  }

  // ── Internals ───────────────────────────────────────────────────────────

  private onRenderStepped(dt: number): void {
    // Keyboard pan (WASD)
    const panSpeed = this.config.zoom * 0.6 * dt;
    let panX = 0;
    let panZ = 0;

    if (UserInputService.IsKeyDown(Enum.KeyCode.W) || UserInputService.IsKeyDown(Enum.KeyCode.Up))
      panZ -= panSpeed;
    if (UserInputService.IsKeyDown(Enum.KeyCode.S) || UserInputService.IsKeyDown(Enum.KeyCode.Down))
      panZ += panSpeed;
    if (UserInputService.IsKeyDown(Enum.KeyCode.A) || UserInputService.IsKeyDown(Enum.KeyCode.Left))
      panX -= panSpeed;
    if (UserInputService.IsKeyDown(Enum.KeyCode.D) || UserInputService.IsKeyDown(Enum.KeyCode.Right))
      panX += panSpeed;

    if (panX !== 0 || panZ !== 0) {
      const yaw = this.config.yawDeg * DEG2RAD;
      const right = new Vector3(math.cos(yaw), 0, math.sin(yaw));
      const forward = new Vector3(-math.sin(yaw), 0, math.cos(yaw));
      this.targetFocus = this.targetFocus
        .add(right.mul(panX))
        .add(forward.mul(panZ));
    }

    // Reset shortcut (handled via InputBegan for single-fire; skip here)


    // Smooth follow
    const alpha = clamp(this.config.smoothness * dt, 0, 1);
    this.currentFocus = new Vector3(
      lerp(this.currentFocus.X, this.targetFocus.X, alpha),
      lerp(this.currentFocus.Y, this.targetFocus.Y, alpha),
      lerp(this.currentFocus.Z, this.targetFocus.Z, alpha),
    );

    this.applyCamera();
  }

  private applyCamera(): void {
    const yaw = this.config.yawDeg * DEG2RAD;
    const pitch = this.isTopDown ? 90 * DEG2RAD : this.config.pitchDeg * DEG2RAD;
    const zoom = this.config.zoom;

    const x = zoom * math.cos(pitch) * math.cos(yaw);
    const y = zoom * math.sin(pitch);
    const z = zoom * math.cos(pitch) * math.sin(yaw);

    const eye = this.currentFocus.add(new Vector3(x, y, z));
    this.camera.CFrame = CFrame.lookAt(eye, this.currentFocus);
  }

  private onInputBegan(input: InputObject, processed: boolean): void {
    if (processed) return;

    if (input.UserInputType === Enum.UserInputType.MouseButton3) {
      this.isDragging = true;
      this.dragStartMouse = new Vector2(input.Position.X, input.Position.Y);
      this.dragStartFocus = this.targetFocus;
    }

    if (input.KeyCode === Enum.KeyCode.T) {
      this.toggleView();
    }

    if (input.KeyCode === Enum.KeyCode.R) {
      this.reset();
    }
  }

  private onInputEnded(input: InputObject): void {
    if (input.UserInputType === Enum.UserInputType.MouseButton3) {
      this.isDragging = false;
    }
  }

  private onInputChanged(input: InputObject): void {
    // Zoom via scroll wheel
    if (input.UserInputType === Enum.UserInputType.MouseWheel) {
      const delta = -input.Position.Z * 8;
      this.setZoom(this.config.zoom + delta);
    }

    // Middle-mouse drag pan
    if (this.isDragging && input.UserInputType === Enum.UserInputType.MouseMovement) {
      const dx = (input.Position.X - this.dragStartMouse.X) * 0.15;
      const dz = (input.Position.Y - this.dragStartMouse.Y) * 0.15;
      const yaw = this.config.yawDeg * DEG2RAD;
      const right = new Vector3(math.cos(yaw), 0, math.sin(yaw));
      const forward = new Vector3(-math.sin(yaw), 0, math.cos(yaw));
      this.targetFocus = this.dragStartFocus
        .sub(right.mul(dx))
        .add(forward.mul(dz));
    }
  }
}
