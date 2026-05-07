# Project

The `project` layer contains the actual resource implementation.

Code is separated by runtime context to improve maintainability, type safety, and runtime isolation.

Each runtime has access only to functionality intended for that environment.

---

# Runtime Layout

| Directory    | Purpose                                                       |
| ------------ | ------------------------------------------------------------- |
| `client/`    | Client-side runtime code executed on the player's game client |
| `server/`    | Server-side runtime code executed on the CFX server           |
| `common/`    | Shared code accessible by all runtimes                        |
| `interface/` | Browser/NUI interface built with Vite                         |
| `static/`    | Static assets and runtime configuration files                 |

---

# Runtime Access Rules

## client/

Contains gameplay logic, client events, UI interaction, hotkeys, and client-native functionality.

Accessible imports:

* `project/client`
* `project/common`
* `modules/client`
* `modules/common`

Cannot access:

* `interface/`
* `server/` & `modules/server`

---

## server/

Contains server-side systems, networking, persistence, commands, and backend logic.

Accessible imports:

* `project/server`
* `project/common`
* `modules/server`
* `modules/common`

Cannot access:

* `interface/`
* `client/` & `modules/client`

---

## common/

Contains code shared across runtimes.

Typical contents:

* shared types
* constants
* validation
* utility helpers
* shared configuration abstractions

Accessible by:

* `client`
* `server`

---

## interface/

Contains the browser-based NUI layer.

Built using Vite and executed inside the embedded Chromium browser runtime.

Accessible imports:

* `project/interface`
* `project/common`
* `modules/common`

Although the `common` runtime is accessible, the interface layer should generally remain isolated from shared gameplay logic.

Shared access should primarily be limited to:

- shared types
- contracts
- schemas
- DTOs
- lightweight runtime-safe utilities

The interface should be treated as an independent frontend layer rather than a direct extension of the client runtime.

Should avoid direct dependency on:

* client-only natives
* server-only logic
* gameplay state management
* runtime-specific side effects

---

## static/

Contains non-compiled runtime assets.

Examples:

* JSON configuration
* language files
* static media
* shared assets

Files are copied directly into the final build output.

---

# Design Principles

The runtime layout is designed around strict environment separation.

This improves:

* bundle correctness
* type safety
* maintainability
* build optimization
* dead-code elimination
* runtime clarity

Shared logic should always be placed in `common/` unless it depends on a runtime-specific API.