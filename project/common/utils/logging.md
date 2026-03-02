# Logging Module (logging.ts)

This module provides a structured, lightweight logging system designed for CFX (FiveM/RedM) resources using TypeScript.

It supports:

- Multiple log levels
- Dev-only logging (`debug` / `trace`)
- Config-driven log filtering
- Scoped loggers (`child`)
- Structured log forwarding (transport system)
- Safe formatting for objects and errors

---

## Location

- Implementation: `project/common/utils/logging.ts`
- Types: `project/common/types/logging.d.ts`

---

## Log Levels

| Level   | Purpose |
|--------|--------|
| `fatal` | Critical failure. System may be corrupted or unusable. |
| `error` | Unexpected failure or exception. |
| `warn`  | Handled issue; system continues safely. |
| `info`  | Normal operational messages. |
| `debug` | Developer-only logs (only visible in dev mode). |
| `trace` | Deep internal tracing (only visible in dev mode). |

---

## Visibility Rules

### Dev mode (`$DEV`)
- `debug` and `trace` only print when running in dev/watch builds
- Controlled by `$DEV` label stripping in your build pipeline

### Config-based filtering

Log level is controlled via:

```ts
Config.Debug.Level
```

Example:

```json
{
  "Debug": {
    "Level": "warn"
  }
}
```

This means:

* Only `warn`, `error`, `fatal` will print
* Lower levels (`info`, `debug`, `trace`) are ignored

### Default fallback

If the config value is invalid or missing:

```ts
'info'
```

is used as fallback.

---

## Basic Usage

```ts
import { logger } from '@common/utils/logging';

logger.info('Resource started');
logger.warn('Invalid argument', { arg: 'test' });
logger.error('Database failed', new Error('timeout'));
logger.fatal('Missing config.json');
```

---

## Dev-only Logging

Use `$DEV:` for logs that should not exist in production builds:

```ts
$DEV: logger.debug('Loaded config', config);
$DEV: logger.trace('Internal state', state);
```

These lines are **removed entirely** during production builds.

---

## Scoped Logging (`child`)

Create scoped loggers to organize output:

```ts
const dbLog = logger.child('database');

dbLog.info('Connected');
dbLog.error('Query failed');
```

Output will include scope:

```
[resource] [database] INFO  Connected
```

Scopes can be chained:

```ts
const inv = logger.child('inventory');
const bags = inv.child('bags');

bags.info('Opened');
```

Result:

```
[resource] [inventory:bags] INFO Opened
```

---

## Runtime Level Control (`setLevel`)

Each logger instance can override its level:

```ts
logger.setLevel('warn');
```

This affects only that logger instance.

Note:

* `debug` and `trace` still require dev mode to print

---

## Custom Logger (`createLogger`)

Create fully customized loggers:

```ts
import { createLogger } from '@common/utils/logging';

const log = createLogger({
  prefix: '[my-resource]',
  level: 'info'
});

log.info('Custom logger ready');
```

---

## Logger Options

```ts
interface LoggerOptions {
  resource?: string;
  prefix?: string;
  scope?: string;
  level?: LogLevel;
  transport?: LoggerTransport;
  fatalThrows?: boolean;
}
```

### Options explained

* `resource`

  * Overrides resource name
  * Default: `GetCurrentResourceName()`

* `prefix`

  * Extra text before logs (e.g. `[core]`)

* `scope`

  * Initial scope name

* `level`

  * Minimum log level (default: `info`)

* `transport`

  * Forward logs to another system

* `fatalThrows`

  * If `true`, `fatal()` throws after logging

---

## Structured Logging (Transport)

You can forward logs to another system:

```ts
import { createLogger, createNetTransport } from '@common/utils/logging';

const log = createLogger({
  transport: createNetTransport('mylog:ingest')
});
```

### `createNetTransport(eventName, toServer)`

* `toServer = false`
  → `emit(eventName, entry)`

* `toServer = true`
  → `emitNet(eventName, entry)`

Useful for:

* log collectors
* discord/webhook systems
* external logging resources

---

## Log Entry Format

Each log internally uses:

```ts
interface LogEntry {
  level: LogLevel;
  resource?: string;
  scope?: string;
  message: string;
  meta?: unknown;
  time: number;
}
```

---

## Metadata (`meta`)

You can attach extra data:

```ts
logger.warn('Invalid input', { value: 42 });
```

### Supported:

* objects
* arrays
* strings
* `Error` (includes stack trace)
* bigint (converted safely)

---

## Output Formatting

Example output:

```
[my-resource] [database] ERROR Query failed
{
  "message": "timeout",
  "stack": "..."
}
```

### Colors (CFX)

* Red → `fatal`, `error`
* Yellow → `warn`
* Green → `info`
* Blue → `debug`
* Gray → `trace`

---

## Dev Detection

```ts
import { isDev } from '@common/utils/logging';

if (isDev()) {
  // runtime dev logic
}
```

Use `$DEV:` for logs, and `isDev()` for runtime behavior.

---

## Best Practices

### ✔ Use correct log levels

* `info` → normal state
* `warn` → recoverable issues
* `error` → failures
* `fatal` → critical issues

### ✔ Use `$DEV` for debug/trace

Avoid runtime overhead in production.

### ✔ Use scopes

Keeps logs readable in large systems.

### ✔ Avoid logging sensitive data

Especially on client-side.

---

## Example (recommended usage)

```ts
logger.info('Resource initialized');

$DEV: logger.debug('Config loaded', Config);

try {
  // some logic
} catch (e) {
  logger.error('Unhandled exception', e);
}
```

---
