# Hotkey Module (hotkey.ts)

This module provides a structured hotkey wrapper for CFX (FiveM/RedM) client builds using TypeScript.

It wraps:

* `RegisterCommand`
* `RegisterKeyMapping`

and adds a higher-level input model with support for:

* key down events
* key up events
* completed short press events
* hold events
* grouped tap counting
* runtime enable / disable
* automatic command name generation

---

## Location

* Implementation: `project/client/utils/hotkey.ts`
* Types: `project/common/types/hotkey.d.ts`

---

## Purpose

The hotkey module exists to avoid repeating raw FiveM key registration boilerplate in every resource.

Instead of manually writing:

* `RegisterCommand(...)`
* `RegisterKeyMapping(...)`
* `+command`
* `-command`
* hold timers
* tap grouping logic

you can create a `Hotkey` instance and attach handlers for the events you need.

---

## Basic Usage

```ts
import { Hotkey } from "@client/utils/hotkey";

const hotkey = new Hotkey({
  name: "setSpeed",
  description: "Speed Control: Set speed",
  defaultMapper: "keyboard",
  defaultParameter: "LEFT",
});

hotkey.onPress(() => {
  console.log("short press");
});
```

---

## Constructor

```ts
new Hotkey(options)
```

### Example

```ts
const hotkey = new Hotkey({
  name: "increaseSpeed",
  description: "Speed Control: Increase speed",
  defaultMapper: "keyboard",
  defaultParameter: "UP",
  tapWindowMs: 250,
});
```

---

## Options

| Option             | Purpose                                                |
| ------------------ | ------------------------------------------------------ |
| `name`             | Logical hotkey name used to generate command names     |
| `description`      | Label shown in FiveM key mapping settings              |
| `defaultMapper`    | Input mapper passed to `RegisterKeyMapping`            |
| `defaultParameter` | Default bound key/button                               |
| `prefix`           | Command name prefix, defaults to current resource name |
| `tapWindowMs`      | Tap grouping window used for multi-tap resolution      |
| `enabled`          | Whether the hotkey starts enabled                      |

### Defaults

If a value is missing:

* `defaultMapper` → `"keyboard"`
* `defaultParameter` → `""`
* `prefix` → `ResourceName`
* `tapWindowMs` → `250`
* `enabled` → `true`

---

## Generated Command Names

The hotkey automatically generates internal command names.

Example:

```ts
new Hotkey({
  name: "increaseSpeed",
  description: "Speed Control: Increase speed",
});
```

If the resource name is:

```ts
cfx-speedcontrol
```

Then the generated commands become:

```txt
+cfx-speedcontrol_increaseSpeed
-cfx-speedcontrol_increaseSpeed
```

The press command is the one registered with `RegisterKeyMapping`.

---

## Event Model

The module exposes two kinds of events:

### Raw input events

These reflect the physical key state.

* `onDown(handler)`
* `onUp(handler)`

### Interpreted input events

These are higher-level gesture events.

* `onPress(handler)`
* `onHold(delayMs, handler)`
* `onTap(handler)`

---

## API

### `hotkey.onDown(handler)`

Called immediately when the key is pressed down.

```ts
hotkey.onDown(() => {
  console.log("key down");
});
```

---

### `hotkey.onUp(handler)`

Called immediately when the key is released.

```ts
hotkey.onUp(() => {
  console.log("key up");
});
```

---

### `hotkey.onPress(handler)`

Called when a completed short press occurs.

A press is only considered valid when:

* the key was pressed down
* the key was released
* the input did not become a hold

`onPress()` is intended as the simple/common hotkey behavior.

```ts
hotkey.onPress(() => {
  console.log("short press");
});
```

---

### `hotkey.onHold(delayMs, handler)`

Called once when the key has been held down for at least `delayMs`.

If hold is triggered, the input is treated as a hold instead of a short press.

```ts
hotkey.onHold(1000, () => {
  console.log("held for 1 second");
});
```

---

### `hotkey.onTap(handler)`

Called after the tap grouping window closes.

The callback receives the final grouped tap count.

```ts
hotkey.onTap((_self, count) => {
  console.log("tap count:", count);
});
```

Example possible counts:

* `1`
* `2`
* `3`

This allows multi-tap behavior such as:

```ts
hotkey.onTap((_self, count) => {
  setSpeed(5 * count);
});
```

---

## Handler Signatures

### Standard handler

```ts
type HotkeyEventFunc = (self: Hotkey) => void;
```

### Tap handler

```ts
type HotkeyTapEventFunc = (self: Hotkey, count: number) => void;
```

Handlers receive the hotkey instance itself so they can inspect state or call utility methods.

---

## Event Resolution Rules

### `onDown`

Fires immediately on press.

### `onUp`

Fires immediately on release.

### `onHold`

Fires once if the key remains pressed for at least the configured delay.

### `onPress`

Fires only for a completed short press that did not become a hold.

### `onTap`

Fires after the tap grouping window closes and receives the final tap count.

---

## Priority Rules

Hotkey resolution follows these rules:

### Without `onTap()`

If `onTap()` is **not** registered:

* a completed short press calls `onPress()` immediately on key release
* no tap grouping delay is used
* if the input becomes a hold, `onPress()` is not called

### With `onTap()`

If `onTap()` **is** registered:

* taps are grouped until the tap window closes
* if the final tap count is `1` **and** `onPress()` exists, `onPress()` is called
* if the final tap count is `1` and `onPress()` does **not** exist, `onTap(self, 1)` is called
* if the final tap count is greater than `1`, `onTap(self, count)` is called

### Hold behavior

If the input becomes a hold:

* `onHold()` is called once
* `onPress()` is not called
* `onTap()` is not called for that input

---

## Resolution Summary

| Situation                                            | Result                              |
| ---------------------------------------------------- | ----------------------------------- |
| No `onTap()`, short press                            | `onPress()` immediately on release  |
| `onTap()` registered, single tap, `onPress()` exists | `onPress()` after tap window closes |
| `onTap()` registered, single tap, no `onPress()`     | `onTap(self, 1)`                    |
| `onTap()` registered, double tap or more             | `onTap(self, count)`                |
| Hold reached                                         | `onHold()` only                     |

---

## Example

```ts
hotkey
  .onPress(() => {
    console.log("single short press");
  })
  .onTap((_self, count) => {
    console.log("tap count:", count);
  });
```

Behavior:

* 1 tap → `onPress()`
* 2 taps → `onTap(self, 2)`
* 3 taps → `onTap(self, 3)`

If `onPress()` is removed:

* 1 tap → `onTap(self, 1)`
* 2 taps → `onTap(self, 2)`

---

## Hold Behavior

Hold detection starts when the key goes down.

If the key remains down for the configured duration:

* `onHold()` fires once
* the input is treated as a hold
* short press logic should not also fire for the same input

Example:

```ts
hotkey
  .onPress(() => {
    console.log("short press");
  })
  .onHold(750, () => {
    console.log("hold");
  });
```

Expected result:

* released before `750ms` → `onPress`
* held for at least `750ms` → `onHold`

---

## Tap Grouping Behavior

Tap grouping is controlled by:

```ts
tapWindowMs
```

Example:

```ts
const hotkey = new Hotkey({
  name: "mode",
  description: "Mode",
  tapWindowMs: 250,
});
```

Behavior:

* every completed tap increases the pending tap count
* after each tap, the tap resolution timer is restarted
* the tap sequence only resolves once no new tap has occurred for the full tap window

This means the final tap count is:

> the number of taps performed before a full `tapWindowMs` period passes with no additional tap

### Example

With `tapWindowMs = 250`:

* 1 tap, then no new tap for `250ms` → count `1`
* 3 taps, each less than `250ms` apart, then no new tap for `250ms` → count `3`
* repeated taps can continue increasing the count as long as each next tap happens before the window expires

---

## Important Note

The tap window is **rolling**, not fixed from the first tap.

A new tap restarts the timer.

Because of that, a tap chain can continue for as long as the user keeps tapping before the window expires.

---

## State Helpers

### `hotkey.isEnabled()`

Returns whether the hotkey is enabled.

```ts
if (hotkey.isEnabled()) {
  console.log("hotkey enabled");
}
```

---

### `hotkey.isDown()`

Returns whether the key is currently pressed.

```ts
if (hotkey.isDown()) {
  console.log("currently held");
}
```

---

### `hotkey.getPendingTapCount()`

Returns the current tap count waiting to resolve.

```ts
console.log(hotkey.getPendingTapCount());
```

---

### `hotkey.enable()`

Enables the hotkey.

```ts
hotkey.enable();
```

---

### `hotkey.disable()`

Disables the hotkey and clears active press/tap state.

```ts
hotkey.disable();
```

---

## Command Name Helpers

### `hotkey.getBaseCommandName()`

Returns generated base command name.

```ts
console.log(hotkey.getBaseCommandName());
```

Example:

```txt
cfx-speedcontrol_increaseSpeed
```

---

### `hotkey.getPressCommandName()`

Returns generated press command name.

```txt
+cfx-speedcontrol_increaseSpeed
```

---

### `hotkey.getReleaseCommandName()`

Returns generated release command name.

```txt
-cfx-speedcontrol_increaseSpeed
```

---

## Example (Simple Press)

```ts
import { Hotkey } from "@client/utils/hotkey";

new Hotkey({
  name: "setSpeed",
  description: "Speed Control: Set speed",
  defaultMapper: "keyboard",
  defaultParameter: "LEFT",
}).onPress(() => {
  console.log("set speed");
});
```

---

## Example (Press + Hold)

```ts
import { Hotkey } from "@client/utils/hotkey";

new Hotkey({
  name: "decreaseSpeed",
  description: "Speed Control: Decrease speed",
  defaultMapper: "keyboard",
  defaultParameter: "DOWN",
}).onPress(() => {
  console.log("short decrease");
}).onHold(1000, () => {
  console.log("held decrease");
});
```

---

## Example (Tap Count Scaling)

```ts
import { Hotkey } from "@client/utils/hotkey";

new Hotkey({
  name: "setSpeed",
  description: "Speed Control: Set speed",
  defaultMapper: "keyboard",
  defaultParameter: "LEFT",
  tapWindowMs: 250,
}).onTap((_self, count) => {
  setSpeed(5 * count);
});
```

Possible results:

* 1 tap → `setSpeed(5)`
* 2 taps → `setSpeed(10)`
* 3 taps → `setSpeed(15)`

---

## Example (Raw Down / Up)

```ts
import { Hotkey } from "@client/utils/hotkey";

new Hotkey({
  name: "debugInput",
  description: "Debug Input",
  defaultMapper: "keyboard",
  defaultParameter: "F7",
})
  .onDown(() => {
    console.log("pressed");
  })
  .onUp(() => {
    console.log("released");
  });
```

---

## Best Practices

### ✔ Use `onPress()` for simple actions

For most hotkeys, a completed short press is the expected behavior.

---

### ✔ Use `onHold()` for long-press actions

Do not manually rebuild hold timers in each resource.

---

### ✔ Use `onTap()` for count-based scaling or combos

This is especially useful when repeated taps should increase an action level.

---

### ✔ Keep hotkey names logical

Use names like:

* `setSpeed`
* `increaseSpeed`
* `pauseResume`

Avoid manually including `+` or `-` in the name.

---

### ✔ Let the wrapper generate command names

Do not manually write paired `+command` / `-command` names outside the utility.

---

### ✔ Disable instead of trying to unregister

FiveM key mapping registration is intended to be one-time.
If you need to stop behavior temporarily, disable the hotkey instead of trying to remove the mapping.

---

## Notes

### Client-only

This utility is intended for client-side use because it relies on:

* `RegisterCommand`
* `RegisterKeyMapping`

---

### One-time registration

Each hotkey instance registers its commands and key mapping during construction.

The wrapper is designed for hotkeys that live for the resource lifetime.

---

### Tap delay

When tap grouping is used, resolution is intentionally delayed until the tap window closes.

This is required to know whether the input was:

* a single tap
* a double tap
* a triple tap

---

## Recommended Usage

```ts
import { Hotkey } from "@client/utils/hotkey";
import { logger } from "@common/utils/logging";

const increaseHotkey = new Hotkey({
  name: "increaseSpeed",
  description: "Speed Control: Increase speed",
  defaultMapper: "keyboard",
  defaultParameter: "UP",
  tapWindowMs: 250,
});

increaseHotkey
  .onDown(() => {
    $DEV: logger.trace("increase key down");
  })
  .onUp(() => {
    $DEV: logger.trace("increase key up");
  })
  .onHold(1000, () => {
    $DEV: logger.trace("increase hold");
  })
  .onTap((_self, count) => {
    $DEV: logger.trace(`increase tap count ${count}`);
  });
```
