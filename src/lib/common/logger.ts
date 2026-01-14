/**
 * Logging levels for ClearBoot application.
 * - silent: No logs
 * - minimal: Only critical startup/shutdown messages
 * - info: Important events (routes, lifecycle)
 * - debug: All events including request details
 */
export type LogLevel = "silent" | "minimal" | "info" | "debug";

/**
 * Logger configuration.
 */
export interface LoggerConfig {
  /** Log level (default: auto-detect) */
  level?: LogLevel;
  /** Custom transport function for logs */
  transport?: (message: string, level: LogLevel) => void;
  /** Enable/disable colors in logs (default: true) */
  colors?: boolean;
  /** Enable/disable timestamps (default: false) */
  timestamp?: boolean;
  /** Custom prefix for all log messages */
  prefix?: string;
  /** Custom formatter function */
  formatter?: (message: string, level: LogLevel, timestamp?: Date) => string;
  /** Enable/disable emoji in logs (default: true) */
  emoji?: boolean;
}

/**
 * Internal logger state.
 */
class Logger {
  private level: LogLevel = "info";
  private transport?: (message: string, level: LogLevel) => void;
  private colors: boolean = true;
  private timestamp: boolean = false;
  private prefix: string = "";
  private emoji: boolean = true;
  private formatter?: (
    message: string,
    level: LogLevel,
    timestamp?: Date,
  ) => string;

  /** Expose current level */
  getLevel(): LogLevel {
    return this.level;
  }

  /** Configure logger */
  configure(config: LoggerConfig = {}) {
    // Auto-detect: silent in tests, else check env var, else config, else info
    const defaultLevel =
      process.env.NODE_ENV === "test"
        ? "silent"
        : (process.env.LOG_LEVEL as LogLevel) || "info";
    this.level = config.level ?? defaultLevel;
    this.transport = config.transport;
    this.colors = config.colors ?? true;
    this.timestamp = config.timestamp ?? false;
    this.prefix = config.prefix ?? "";
    this.emoji = config.emoji ?? true;
    this.formatter = config.formatter;
  }

  /** Check if level should be logged */
  private shouldLog(targetLevel: LogLevel): boolean {
    const levels: LogLevel[] = ["silent", "minimal", "info", "debug"];
    const currentIndex = levels.indexOf(this.level);
    const targetIndex = levels.indexOf(targetLevel);
    return targetIndex <= currentIndex;
  }

  /** Log message at specified level */
  private log(message: string, level: LogLevel) {
    if (!this.shouldLog(level)) return;

    let output = message;

    // Apply custom formatter if provided
    if (this.formatter) {
      output = this.formatter(
        message,
        level,
        this.timestamp ? new Date() : undefined,
      );
    } else {
      // Default formatting
      if (this.prefix) output = `${this.prefix} ${output}`;
      if (this.timestamp) output = `[${new Date().toISOString()}] ${output}`;
      if (!this.colors) {
        // Strip ANSI color codes
        output = output.replace(/\x1b\[[0-9;]*m/g, "");
      }
      if (!this.emoji) {
        // Strip common emoji ranges
        output = output.replace(
          /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
          "",
        );
      }
    }

    if (this.transport) {
      this.transport(output, level);
    } else {
      console.log(output);
    }
  }

  /** Log minimal level messages */
  minimal(message: string) {
    this.log(message, "minimal");
  }

  /** Log info level messages */
  info(message: string) {
    this.log(message, "info");
  }

  /** Log debug level messages */
  debug(message: string) {
    this.log(message, "debug");
  }
}

/** Global logger instance */
export const logger = new Logger();
