# Resource Module (resource.ts)

This module provides environment detection and resource metadata helpers for CFX (FiveM/RedM) resources.

It standardizes how your code determines:

- Where it is running (server / client / NUI / browser)
- The current resource name
- The correct file path (dev vs production)

---

## Location

- Implementation: `project/common/utils/resource.ts`

---

## Overview

This module exports four key values:

```ts
IsBrowser
ResourceContext
ResourceName
ResourcePath
```

---

## IsBrowser

```ts
export const IsBrowser: 0 | 1 | 2;
```

Determines if the code is running in a browser environment.

### Values

| Value | Meaning                                               |
| ----- | ----------------------------------------------------- |
| `0`   | Game environment (client/server runtime)              |
| `1`   | CEF (NUI inside FiveM)                                |
| `2`   | External browser (e.g. opening UI in Chrome manually) |

### Logic

```ts
typeof window === 'undefined' → 0 (game)
window.GetParentResourceName exists → 1 (CEF)
otherwise → 2 (browser)
```

---

## `ResourceContext`

```ts
export const ResourceContext: 'server' | 'client' | 'web';
```

Determines where the resource is executing.

### Values

| Value    | Meaning        |
| -------- | -------------- |
| `server` | Server runtime |
| `client` | Client runtime |
| `web`    | NUI / browser  |

### Logic

```ts
IsBrowser ? 'web' : IsDuplicityVersion() ? 'server' : 'client'
```

---

## `ResourceName`

```ts
export const ResourceName: string;
```

Returns the current resource name depending on environment.

### Behavior

| Context          | Value                            |
| ---------------- | -------------------------------- |
| Server / Client  | `GetCurrentResourceName()`       |
| NUI (CEF)        | `window.GetParentResourceName()` |
| External Browser | `"nui-frame-app"`                |

### Notes

* In CEF, FiveM injects `GetParentResourceName()`
* In standalone browser testing, a fallback is used

---

## `ResourcePath`

```ts
export const ResourcePath: string;
```

Provides the correct file base path depending on build mode.

### Behavior

| Mode         | Value      |
| ------------ | ---------- |
| Dev (`$DEV`) | `"./dist"` |
| Production   | `"."`      |

### Purpose

Used for loading files such as:

* config files
* locales
* static assets

### Example

```ts
const configPath = `${ResourcePath}/static/config.json`;
```

---

## Dev Mode Behavior

This module uses your `$DEV` build label:

```ts
$DEV: {
  _devResourcePath = "./dist";
}
```

### Effect

* In dev/watch builds → `ResourcePath = "./dist"`
* In production builds → `$DEV` block is removed → `ResourcePath = "."`

This ensures:

* Dev environment matches your build output
* Production environment matches actual resource root

---

## Example Usage

### Detect environment

```ts
import { ResourceContext } from '@common/utils/resource';

if (ResourceContext === 'server') {
  // server logic
}
```

---

### Load config file

```ts
import { ResourcePath } from '@common/utils/resource';

const path = `${ResourcePath}/static/config.json`;
```

---

### Get resource name

```ts
import { ResourceName } from '@common/utils/resource';

console.log(ResourceName);
```

---

### Handle NUI vs Game logic

```ts
import { IsBrowser } from '@common/utils/resource';

if (IsBrowser === 1) {
  // running in NUI
}
```

---

## Best Practices

### ✔ Use `ResourceContext` instead of custom checks

Avoid duplicating logic like `IsDuplicityVersion()` everywhere.

---

### ✔ Use `ResourcePath` for file access

Ensures compatibility between dev and production builds.

---

### ✔ Avoid hardcoding resource names

Always use `ResourceName`.

---

### ✔ Handle browser mode safely

If testing UI outside FiveM, expect:

```ts
IsBrowser === 2
ResourceName === 'nui-frame-app'
```

---

## Summary

This module acts as a **central abstraction layer** for:

* runtime environment detection
* resource naming
* file path resolution

It ensures your code behaves consistently across:

* server
* client
* NUI (CEF)
* standalone browser testing

---