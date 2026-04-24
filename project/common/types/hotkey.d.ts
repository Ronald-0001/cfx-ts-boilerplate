
export type HotkeyEventFunc<TSelf extends Hotkey = Hotkey> = (self: TSelf) => void;
export type HotkeyTapEventFunc<TSelf extends Hotkey = Hotkey> = (self: TSelf, count: number) => void;

export interface HotkeyOptions {
  /**
   * Logical hotkey name without `+` / `-`.
   *
   * Example: `setSpeed`, `increaseSpeed`
   */
  name: string;

  /**
   * Display label shown in FiveM key mapping settings.
   */
  description: string;

  /**
   * Input mapper used by RegisterKeyMapping.
   *
   * Example: `keyboard`
   */
  defaultMapper?: string;

  /**
   * Default key/button value used by RegisterKeyMapping.
   *
   * Example: `LEFT`, `UP`, `RSHIFT`
   */
  defaultParameter?: string;

  /**
   * Prefix used for generated command names.
   *
   * Defaults to the current resource name.
   */
  prefix?: string;

  /**
   * Window used to group taps together.
   *
   * Example:
   * - 1 tap, no second tap within 250ms => count = 1
   * - 2 taps within 250ms => count = 2
   */
  tapWindowMs?: number;

  /**
   * Whether the hotkey starts enabled.
   *
   * Defaults to true.
   */
  enabled?: boolean;
}

export interface HoldBinding {
  delayMs: number;
  handler: HotkeyEventFunc;
}