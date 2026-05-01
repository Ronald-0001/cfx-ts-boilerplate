import { logger } from "@common/logging";
import { ResourceName } from "@common/resource";
import {
  HotkeyEventFunc,
  HotkeyTapEventFunc,
  HotkeyOptions,
  HoldBinding
} from "@client/hotkey/types";

export class Hotkey {
  public readonly name: string;
  public readonly description: string;
  public readonly defaultMapper: string;
  public readonly defaultParameter: string;
  public readonly prefix: string;
  public readonly tapWindowMs: number;

  private enabled: boolean;

  private downHandler?: HotkeyEventFunc;
  private upHandler?: HotkeyEventFunc;
  private pressHandler?: HotkeyEventFunc;
  private tapHandler?: HotkeyTapEventFunc;
  private holdBinding?: HoldBinding;

  private pressed = false;
  private holdTriggered = false;

  private tapCount = 0;

  private holdTimeout?: ReturnType<typeof setTimeout>;
  private holdInterval?: ReturnType<typeof setInterval>;
  private tapTimeout?: ReturnType<typeof setTimeout>;

  constructor(options: HotkeyOptions) {
    this.name = options.name;
    this.description = options.description;
    this.defaultMapper = options.defaultMapper ?? "keyboard";
    this.defaultParameter = options.defaultParameter ?? "";
    this.prefix = options.prefix ?? ResourceName;
    this.tapWindowMs = options.tapWindowMs ?? 250;
    this.enabled = options.enabled ?? true;

    this.register();
  }

  /**
   * Called immediately when the key is pressed down.
   */
  public onDown(handler?: HotkeyEventFunc): this {
    this.downHandler = handler;
    return this;
  }

  /**
   * Called immediately when the key is released.
   */
  public onUp(handler?: HotkeyEventFunc): this {
    this.upHandler = handler;
    return this;
  }

  /**
   * Called once after the key is released, only if the press did not become a hold.
   *
   * This is the simple/common hotkey behavior.
   *
   * Internally, this is driven by the tap system and will only fire for single-tap input.
   */
  public onPress(handler?: HotkeyEventFunc): this {
    this.pressHandler = handler;
    return this;
  }

  /**
   * Called once after the key is released and the tap grouping window closes.
   *
   * The callback receives the final grouped tap count.
   */
  public onTap(handler?: HotkeyTapEventFunc): this {
    this.tapHandler = handler;
    return this;
  }

  /**
   * Called once when the key has been held down for at least `delayMs`.
   *
   * If hold is triggered, `onPress` and `onTap` are not fired for that press.
   */
  public onHold(delayMs: number, handler?: HotkeyEventFunc, allowRepeat?: boolean): this {
    this.holdBinding = {
      delayMs,
      handler: handler ?? (() => {}),
      allowRepeat: allowRepeat ?? false,
    };

    return this;
  }

  /**
   * Enables the hotkey.
   */
  public enable(): this {
    this.enabled = true;
    return this;
  }

  /**
   * Disables the hotkey.
   *
   * Any active press state is cleared.
   */
  public disable(): this {
    this.enabled = false;
    this.resetPressState();
    this.resetTapState();
    return this;
  }

  /**
   * Returns whether the hotkey is enabled.
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Returns whether the key is currently held down.
   */
  public isDown(): boolean {
    return this.pressed;
  }

  /**
   * Returns the current grouped tap count waiting to resolve.
   */
  public getPendingTapCount(): number {
    return this.tapCount;
  }

  /**
   * Generated command name without `+` / `-`.
   */
  public getBaseCommandName(): string {
    return `${this.prefix}_${this.name}`;
  }

  /**
   * Generated press command name used for RegisterKeyMapping.
   */
  public getPressCommandName(): string {
    return `+${this.getBaseCommandName()}`;
  }

  /**
   * Generated release command name.
   */
  public getReleaseCommandName(): string {
    return `-${this.getBaseCommandName()}`;
  }

  private register() {
    RegisterCommand(this.getPressCommandName(), () => {
      this.handleDown();
    }, false);

    RegisterCommand(this.getReleaseCommandName(), () => {
      this.handleUp();
    }, false);

    RegisterKeyMapping(
      this.getPressCommandName(),
      this.description,
      this.defaultMapper,
      this.defaultParameter,
    );

    $DEV: logger.trace(`Registered hotkey ${this.getBaseCommandName()}`);
  }

  private handleDown() {
    if (!this.enabled) return;
    if (this.pressed) return;

    this.pressed = true;
    this.holdTriggered = false;

    $DEV: logger.trace(`Hotkey ${this.getPressCommandName()} pressed`);

    this.downHandler?.(this);

    if (this.holdBinding) {
      this.clearHoldTimeout();

      this.holdTimeout = setTimeout(() => {
        if (!this.isDown) return;

        this.holdTriggered = true;
        this.holdBinding?.handler?.(this);

        if (this.holdBinding?.allowRepeat) {
          this.holdInterval = setInterval(() => {
            if (!this.isDown) return;

            this.holdBinding?.handler?.(this);
          }, this.holdBinding?.delayMs);
        }
      }, this.holdBinding.delayMs);
    }
  }

  private handleUp() {
    if (!this.pressed) return;

    this.clearHoldTimeout();
    this.pressed = false;

    $DEV: logger.trace(`Hotkey ${this.getReleaseCommandName()} released`);

    this.upHandler?.(this);

    if (this.holdTriggered) {
      this.holdTriggered = false;
      return;
    }
    
    if (this.tapHandler) {
      this.queueTap();
      return;
    }

    this.pressHandler?.(this);

  }

  private queueTap() {
    this.tapCount += 1;

    this.clearTapTimeout();

    this.tapTimeout = setTimeout(() => {
      const count = this.tapCount;

      this.tapCount = 0;
      this.tapTimeout = undefined;

      $DEV: logger.trace(`Hotkey ${this.getBaseCommandName()} tap resolved with count ${count}`);

      if (count === 1 && this.pressHandler) {
        this.pressHandler?.(this);
        return;
      }

      this.tapHandler?.(this, count);
    }, this.tapWindowMs);
  }

  private clearHoldTimeout() {
    if (this.holdTimeout) {
      clearTimeout(this.holdTimeout);
      this.holdTimeout = undefined;
    }

    if (this.holdInterval) {
      clearInterval(this.holdInterval);
      this.holdInterval = undefined;
    }
  }

  private clearTapTimeout() {
    if (!this.tapTimeout) return;

    clearTimeout(this.tapTimeout);
    this.tapTimeout = undefined;
  }

  private resetPressState() {
    this.clearHoldTimeout();
    this.pressed = false;
    this.holdTriggered = false;
  }

  private resetTapState() {
    this.clearTapTimeout();
    this.tapCount = 0;
  }
}