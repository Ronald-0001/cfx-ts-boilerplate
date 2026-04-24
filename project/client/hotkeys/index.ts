import { Hotkey } from "../utils/hotkey";
import { logger } from "@common/utils/logging";

export function registerDemoHotkey() {
  const demohotkey = new Hotkey({
    name: "demohotkey", // Unique name of the hotkey, used for saving user keybindings and in commands
    description: "Demo Hotkey", // Description of the hotkey, shown in the keybinding menu
    defaultMapper: "keyboard", // Default to keyboard
    defaultParameter: "", // No default keybinding, user must set it up manually
    tapWindowMs: 250, // Time window for grouping taps, in milliseconds
    prefix: "demo" // Command prefix, used for generating command names like "demo:demohotkey", defaults to the resource name
  })
    .onDown(() => {
      $DEV: logger.trace("Hotkey demohotkey down");
      // onDown triggers immediately when the key is pressed
    })
    .onUp(() => {
      $DEV: logger.trace("Hotkey demohotkey up");
      // onUp triggers immediately when the key is released
    })
    .onPress(() => {
      $DEV: logger.trace("Hotkey demohotkey single press");
      // onPress triggers after the key have been pressed and released again, when not held or tapped
    })
    .onHold(500, () => {
      $DEV: logger.trace("Hotkey demohotkey hold");
      // onHold triggers after the key has been held for at least the specified duration (500ms in this case), regardless of taps
    })
    .onTap((_self, count) => {
      $DEV: logger.trace(`Hotkey demohotkey tap count ${count}`);
      // onTap triggers after the key has been pressed and released again, grouped by the tap window. The callback receives the final tap count for the grouping
    });

  demohotkey.disable(); // Disable the hotkey
  demohotkey.enable(); // Enable the hotkey
}