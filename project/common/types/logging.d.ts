export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LogEntry {
  level: LogLevel;
  /** resource name if available */
  resource?: string;
  /** logger scope (e.g. "db", "inventory") */
  scope?: string;
  /** main message */
  message: string;
  /** optional metadata (object, error details, etc.) */
  meta?: unknown;
  /** unix ms timestamp */
  time: number;
}

export interface LoggerTransport {
  /**
   * Called with a structured LogEntry. Use this to forward logs
   * to another resource or external sink.
   */
  send(entry: LogEntry): void;
}

export interface LoggerOptions {
  /** fixed resource name; if omitted, uses GetCurrentResourceName() when available */
  resource?: string;
  /** prefix shown in console output, e.g. "[myres]" */
  prefix?: string;
  /** initial scope name (child loggers add/override) */
  scope?: string;

  /**
   * Minimum level to print.
   * Note: debug/trace still require dev mode to print.
   * Default: "info"
   */
  level?: LogLevel;

  /** optional transport for forwarding structured logs */
  transport?: LoggerTransport;

  /**
   * If true, fatal() will throw after logging (server-side recommended).
   * Default: false
   */
  fatalThrows?: boolean;
}

export interface Logger {
  child(scope: string): Logger;
  setLevel(level: LogLevel): void;

  fatal(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  debug(message: string, meta?: unknown): void;
  trace(message: string, meta?: unknown): void;
}