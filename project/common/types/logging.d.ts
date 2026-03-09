/**
 * Supported log severity levels in ascending verbosity order.
 */
export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

/**
 * Structured log entry passed to formatters and transports.
 */
export interface LogEntry {
  level: LogLevel;

  /**
   * Resource name associated with the log entry, when available.
   */
  resource?: string;

  /**
   * Logger scope associated with the entry, such as `db` or `inventory`.
   */
  scope?: string;

  /**
   * Primary human-readable log message.
   */
  message: string;

  /**
   * Optional structured metadata attached to the log entry.
   *
   * This may be an object, error, primitive, or any other runtime value
   * used to provide debugging or contextual information.
   */
  meta?: unknown;

  /**
   * Unix timestamp in milliseconds.
   */
  time: number;
}

/**
 * Transport interface used to forward structured log entries
 * to another runtime target or external sink.
 */
export interface LoggerTransport {
  /**
   * Forwards a structured log entry to another resource, service,
   * or external logging sink.
   *
   * Implementations should avoid throwing whenever possible.
   *
   * @param entry - The structured log entry to forward.
   */
  send(entry: LogEntry): void;
}

/**
 * Configuration options used when creating a logger instance.
 */
export interface LoggerOptions {
  /**
   * Resource name shown in the log output.
   *
   * This identifies which resource the log entry originated from.
   *
   * @default GetCurrentResourceName()
   */
  resource?: string;

  /**
   * Optional prefix displayed before the formatted log line.
   *
   * The prefix is written as provided and is not automatically wrapped
   * or formatted.
   * 
   * @default none
   */
  prefix?: string;

  /**
   * Initial logger scope.
   *
   * Child loggers extend this scope using `parent:child` formatting.
   * 
   * @default none
   */
  scope?: string;

  /**
   * Minimum log level that will be printed by the logger.
   *
   * Entries below this level are ignored.
   * Note: `debug` and `trace` are still suppressed outside dev builds.
   *
   * @default "info"
   */
  level?: LogLevel;

  /**
   * Optional transport used to forward structured log entries
   * to another runtime target or external sink.
   * 
   * @default none
   */
  transport?: LoggerTransport;

  /**
   * When enabled, `fatal()` throws after writing the log entry.
   *
   * This is useful when fatal logs should immediately interrupt execution.
   *
   * @default false
   */
  fatalThrows?: boolean;
}

/**
 * Structured logger interface supporting scoped loggers,
 * runtime level control, and severity-based log methods.
 */
export interface Logger {
  /**
   * Creates a child logger with an extended scope.
   *
   * The child logger inherits the parent configuration and appends
   * a new scope segment using `parent:child` formatting.
   *
   * @param childScope - The scope segment to append.
   * @returns A new scoped logger instance.
   */
  child(childScope: string): Logger;

  /**
   * Updates the minimum log level for the current logger instance.
   *
   * @param level - The new minimum log level.
   */
  setLevel(level: LogLevel): void;

  /**
   * Writes a fatal log entry.
   *
   * @param message - The primary human-readable log message.
   * @param meta - Optional structured metadata such as an error, payload, or contextual runtime state.
   */
  fatal(message: string, meta?: unknown): void;

  /**
   * Writes an error log entry.
   *
   * @param message - The primary human-readable log message.
   * @param meta - Optional structured metadata such as an error, payload, or contextual runtime state.
   */
  error(message: string, meta?: unknown): void;

  /**
   * Writes a warning log entry.
   *
   * @param message - The primary human-readable log message.
   * @param meta - Optional structured metadata such as an error, payload, or contextual runtime state.
   */
  warn(message: string, meta?: unknown): void;

  /**
   * Writes an informational log entry.
   *
   * @param message - The primary human-readable log message.
   * @param meta - Optional structured metadata such as an error, payload, or contextual runtime state.
   */
  info(message: string, meta?: unknown): void;

  /**
   * Writes a debug log entry.
   *
   * Debug logs provide development-level insight into internal behavior.
   * These logs are automatically suppressed outside dev builds.
   *
   * For readability, debug logs are commonly prefixed with the `$DEV:` label.
   * This is optional and only serves as a visual reminder that the call may
   * be removed from production builds by the bundler.
   *
   * Example:
   *
   * $DEV: logger.debug("Player data loaded", playerData)
   *
   * @param message - The primary human-readable log message.
   * @param meta - Optional structured metadata such as an error, payload, or contextual runtime state.
   */
  debug(message: string, meta?: unknown): void;

  /**
   * Writes a trace log entry.
   *
   * Trace logs are the most verbose logging level and are intended for
   * deep execution tracing during development. These logs are automatically
   * suppressed outside dev builds.
   *
   * For readability, trace logs are commonly prefixed with the `$DEV:` label.
   * This is optional and simply indicates that the call may be stripped from
   * production builds.
   *
   * Example:
   *
   * $DEV: logger.trace("Entering inventory sync", { playerId })
   *
   * @param message - The primary human-readable log message.
   * @param meta - Optional structured metadata such as an error, payload, or contextual runtime state.
   */
  trace(message: string, meta?: unknown): void;
}