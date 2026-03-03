# Files Module (files.ts)

This module provides a unified way to load files and JSON across all resource contexts:

- **Server / Client (Game runtime)**: loads from the resource using `LoadResourceFile`
- **Web / NUI (CEF) + external browser**: loads using `fetch()` from the web server

It normalizes path handling using `ResourceName` and `ResourcePath`.

---

## Location

- Implementation: `project/common/utils/files.ts`
- Depends on: `project/common/utils/resource.ts`

---

## Exports

- `LoadFile(path: string): string | null`
- `LoadJsonFile<T = unknown>(path: string): T | Promise<T>`

---

## LoadFile(path)

```ts
export function LoadFile(path: string) {
  return LoadResourceFile(ResourceName, `${ResourcePath}/${path}`);
}
```

### Purpose

Loads a raw file from the resource in **game runtime** (server/client).

### Parameters

* `path`: resource-relative path (example: `static/config.json`)

### Returns

* The file contents as a string, or `null` if the file does not exist.

### Example

```ts
import { LoadFile } from '@common/utils/files';

const raw = LoadFile('static/config.json');
if (!raw) throw new Error('Missing static/config.json');
```

---

## LoadJsonFile(path)

```ts
export function LoadJsonFile<T = unknown>(path: string): T {
  if (!IsBrowser) return JSON.parse(LoadFile(path)) as T;

  const resp = fetch(`/${path}`, { method: 'post', headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
  return resp.then((response) => response.json()) as T;
}
```

### Purpose

Loads and parses JSON from a given path, supporting both:

* **Server/Client**: local JSON file via `LoadResourceFile`
* **Web**: JSON via HTTP fetch

### Parameters

* `path`: resource-relative path (example: `static/locales/en.json`)

### Returns

⚠️ Return type depends on environment:

| Context         | Return type          |
| --------------- | -------------------- |
| Server / Client | `T` (sync)           |
| Web / NUI       | `Promise<T>` (async) |

This is because:

* `LoadResourceFile` is synchronous
* `fetch()` is asynchronous

### Example (Server/Client)

```ts
import { LoadJsonFile } from '@common/utils/files';

const config = LoadJsonFile<{ Debug: { Level: string } }>('static/config.json');
```

### Example (Web/NUI)

```ts
import { LoadJsonFile } from '@common/utils/files';

const config = await LoadJsonFile<{ Debug: { Level: string } }>('static/config.json');
```

---

## Path Handling

Both functions automatically apply:

* `ResourceName` → current resource name
* `ResourcePath` → base path (`./dist` in dev builds, `.` in production)

So you always pass paths like:

* `static/config.json`
* `static/locales/en.json`
* `interface/index.html` (if needed)

You should NOT include `dist/` in paths manually.

---

## Web Fetch Details

When running in a browser context, JSON is loaded using:

```ts
fetch(`/${path}`, { method: 'post', headers: { 'Content-Type': 'application/json' } })
```

This is designed to work with NUI fetch routing.

---

## Best Practices

### ✔ Keep JSON paths resource-relative

Always use:

```ts
LoadJsonFile('static/config.json')
```

Not:

```ts
LoadJsonFile('/static/config.json')
LoadJsonFile('dist/static/config.json')
```

---

### ✔ Be explicit about async usage in web context

If code may run in both game and web contexts, handle both:

```ts
// async function
const cfg = LoadJsonFile('static/config.json');
const config = cfg instanceof Promise ? await cfg : cfg;

// top level "where await is not supported with the CJS format"
let config = LoadJsonFile('static/config.json');
$BROWSER: {
  config = await config;
}
```

---

### ✔ Validate JSON where possible

Parsing does not validate schema. Use Zod or similar validation in higher-level modules (config/language loaders).

---

## Notes / Known Limitations

### Mixed sync/async return type

`LoadJsonFile()` returns `T` in game runtime and `Promise<T>` in web runtime.

---