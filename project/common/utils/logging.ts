import type { LogEntry, LogLevel, Logger, LoggerOptions, LoggerTransport } from '../types/logging';
import Config from './config';
import { isPlainObject } from './guards';

/* ----------------------------- */
/* Dev mode flag via $DEV label  */
/* ----------------------------- */

let __DEV__ = false;
// This line is removed from non-dev builds by esbuild dropLabels,
// and kept in watch/dev builds.
$DEV: (__DEV__ = true);

/* ----------------------------- */
/* Level ordering / filtering    */
/* ----------------------------- */

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10
};

function shouldPrint(level: LogLevel, minLevel: LogLevel): boolean {
  // debug/trace only in dev builds
  if ((level === 'debug' || level === 'trace') && !__DEV__) return false;
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[minLevel];
}

// Internal helper kept private because log level coercion is only needed by this module.
function coerceLevel(v: unknown, fallback: LogLevel): LogLevel {
  return typeof v === 'string' && (Object.keys(LEVEL_WEIGHT) as readonly string[]).includes(v) ? (v as LogLevel) : fallback;
}

/* ----------------------------- */
/* Formatting helpers            */
/* ----------------------------- */

function now() {
  return Date.now();
}

function getResourceNameSafe(): string | undefined {
  try {
    if (typeof GetCurrentResourceName === 'function') return GetCurrentResourceName();
  } catch {}
  return undefined;
}

function safeStringify(value: unknown): string {
  if (value === undefined) return '';
  if (typeof value === 'string') return value;

  // Errors: include stack if available
  if (value instanceof Error) {
    const stack = value.stack ?? value.message ?? String(value);
    return stack;
  }

  try {
    return JSON.stringify(
      value,
      (_k, v) => {
        if (v instanceof Error) return { name: v.name, message: v.message, stack: v.stack };
        if (typeof v === 'bigint') return v.toString();
        return v;
      },
      2
    );
  } catch {
    return String(value);
  }
}

function colorFor(level: LogLevel): string {
  // CFX console colors
  // ^1 light red, ^2 green, ^3 yellow, ^4 light purple, ^5 light blue, ^6 purple, ^7 default, ^8 dark red ^9 dark blue, ^0 white
  switch (level) {
    case 'fatal':
      return '^8';
    case 'error':
      return '^1';
    case 'warn':
      return '^3';
    case 'info':
      return '^2';
    case 'debug':
      return '^5';
    case 'trace':
      return '^6';
    default:
      return '^7';
  }
}

function levelTag(level: LogLevel): string {
  return level.toUpperCase().padEnd(5, ' ');
}

function formatLine(entry: LogEntry, prefix?: string): string {
  const p = prefix ? `${prefix} ` : '';
  const res = entry.resource ? `[${entry.resource}] ` : '';
  const scope = entry.scope ? `[${entry.scope}] ` : '';
  const meta = entry.meta !== undefined ? `\n${safeStringify(entry.meta)}` : '';
  return `${colorFor(entry.level)}${p}${res}${scope}${levelTag(entry.level)} ${entry.message}^7${meta}`;
}

function trace(line: string) {
  // Prefer Citizen.trace for CFX; fallback to console
  try {
    if (typeof Citizen?.trace === 'function') return Citizen.trace(`${line}\n`);
  } catch {}
  // eslint-disable-next-line no-console
  console.log(line);
}

/* ----------------------------- */
/* Transports                    */
/* ----------------------------- */

function getDefaultTransport(): LoggerTransport | undefined {
  const dbg = Config?.Debug;
  if (!isPlainObject(dbg)) return undefined;

  const transport = dbg.Transport;
  if (!isPlainObject(transport)) return undefined;

  const eventName = transport.Event;
  if (typeof eventName !== 'string' || !eventName.trim()) return undefined;

  const toServer = !!transport.ToServer;
  return createNetTransport(eventName, toServer);
}

/**
 * Creates a logger transport that forwards structured log entries through CFX events.
 *
 * The transport emits log entries using either `emitNet` or `emit` depending on
 * the `toServer` flag. This allows logs to be forwarded to a central collector
 * resource or monitoring system.
 *
 * Transport errors are intentionally ignored to ensure logging never crashes
 * the running resource.
 *
 * @param eventName - The event name used when forwarding log entries.
 * @param toServer - When true, entries are sent using `emitNet` (client → server).
 * @returns A logger transport implementation.
 */
export function createNetTransport(eventName: string, toServer = false): LoggerTransport {
  return {
    send(entry) {
      // If running in client context, emitNet goes to server.
      // If running in server context and you want to forward to a collector resource, use emit.
      try {
        if (toServer) {
          emitNet(eventName, entry);
        } else {
          emit(eventName, entry);
        }
      } catch {
        // ignore transport failures
      }
    }
  };
}

/* ----------------------------- */
/* Logger factory                */
/* ----------------------------- */

function makeLogger(options: LoggerOptions): Logger {
  const resource = options.resource ?? getResourceNameSafe();
  const prefix = options.prefix;
  let scope = options.scope;
  let minLevel: LogLevel = options.level ?? 'info';
  const transport = options.transport;
  const fatalThrows = options.fatalThrows ?? false;

  const write = (level: LogLevel, message: string, meta?: unknown) => {
    if (!shouldPrint(level, minLevel)) {
      // still forward structured logs if you want? usually no. keep simple:
      return;
    }

    const entry: LogEntry = {
      level,
      resource,
      scope,
      message,
      meta,
      time: now()
    };

    trace(formatLine(entry, prefix));

    if (transport) {
      try {
        transport.send(entry);
      } catch {
        // do not crash on transport
      }
    }

    if (level === 'fatal' && fatalThrows) {
      throw meta instanceof Error ? meta : new Error(message);
    }
  };

  const logger: Logger = {
    child(childScope: string) {
      // scope chaining: "parent:child"
      const nextScope = scope ? `${scope}:${childScope}` : childScope;
      return makeLogger({ ...options, resource, prefix, scope: nextScope, level: minLevel });
    },

    setLevel(level: LogLevel) {
      minLevel = level;
    },
    getLevel() {
      return minLevel;
    },

    fatal(message: string, meta?: unknown) {
      write('fatal', message, meta);
    },
    error(message: string, meta?: unknown) {
      write('error', message, meta);
    },
    warn(message: string, meta?: unknown) {
      write('warn', message, meta);
    },
    info(message: string, meta?: unknown) {
      write('info', message, meta);
    },
    debug(message: string, meta?: unknown) {
      write('debug', message, meta);
    },
    trace(message: string, meta?: unknown) {
      write('trace', message, meta);
    }
  };

  return logger;
}

/* ----------------------------- */
/* Default logger export         */
/* ----------------------------- */

/**
 * Default logger instance for the current resource.
 *
 * The logger automatically resolves the resource name and reads its
 * minimum log level and transport configuration from `Config.Debug`.
 * It can be used directly or extended through scoped child loggers.
 */
export const logger = makeLogger({
  // show resource name by default via GetCurrentResourceName()
  level: coerceLevel(Config?.Debug?.Level, 'info'),
  transport: getDefaultTransport()
});

/**
 * Creates a new logger instance using the provided configuration.
 *
 * Custom loggers allow resources or subsystems to define their own
 * log level, scope, prefix, transport, and fatal error behavior
 * independent of the default logger.
 *
 * @param options - Logger configuration options.
 * @returns A configured logger instance.
 */
export function createLogger(options: LoggerOptions): Logger {
  return makeLogger(options);
}

/**
 * Indicates whether the current runtime is running in a dev build.
 *
 * The value is controlled by the `$DEV` build label and is typically
 * used to enable development-only behavior such as verbose logging.
 *
 * @returns True when the current build is a development build.
 */
export function isDev(): boolean {
  return __DEV__;
}