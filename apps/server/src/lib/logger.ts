/**
 * Buffered logger — collects log lines during a job and flushes them in one
 * atomic write so that concurrent jobs never interleave their output.
 *
 * Usage:
 *   const logger = new Logger("analyze-content", jobId);
 *   logger.info(`start emailId=${id}`);
 *   logger.error("something went wrong", err);
 *   logger.flush();   // prints all buffered lines at once
 *
 * Services that receive a logger use scope() to prefix their own messages:
 *   const log = logger.scope("job-tracking");
 *   log.info("start ...");   // → [analyze-content:<id>] [job-tracking] start ...
 *   log.error("boom", err);  // → [analyze-content:<id>] ERROR [job-tracking] boom
 *
 * Each line is prefixed with:
 *   [<tag>:<correlationId>] <level> <message>
 *
 * The level prefix is omitted for "info" to keep the happy-path output terse
 * (matching the existing log style). "warn" and "error" lines are prefixed
 * explicitly so they stand out.
 */

type LogLevel = "info" | "warn" | "error";

interface LogLine {
  level: LogLevel;
  message: string;
  extra?: unknown;
}

export interface ScopedLogger {
  info(message: string): void;
  warn(message: string, extra?: unknown): void;
  error(message: string, extra?: unknown): void;
}

export class Logger {
  private readonly prefix: string;
  private readonly lines: LogLine[] = [];

  /**
   * @param tag           Short name for the component, e.g. "analyze-content"
   * @param correlationId Job ID or any unique string that ties lines together
   */
  constructor(
    private readonly tag: string,
    private readonly correlationId: string
  ) {
    this.prefix = `[${tag}:${correlationId}]`;
  }

  // ---------------------------------------------------------------------------
  // Public log methods — all buffered until flush()
  // ---------------------------------------------------------------------------

  info(message: string): void {
    this.lines.push({ level: "info", message });
  }

  warn(message: string, extra?: unknown): void {
    this.lines.push({ level: "warn", message, extra });
  }

  error(message: string, extra?: unknown): void {
    this.lines.push({ level: "error", message, extra });
  }

  // ---------------------------------------------------------------------------
  // scope() — returns a ScopedLogger that prepends [tag] to every message and
  // writes into this logger's buffer. Services call this instead of building
  // their own ternary fallback logic.
  // ---------------------------------------------------------------------------

  scope(tag: string): ScopedLogger {
    const prefix = `[${tag}]`;
    return {
      info:  (message: string)                => this.info(`${prefix} ${message}`),
      warn:  (message: string, extra?: unknown) => this.warn(`${prefix} ${message}`, extra),
      error: (message: string, extra?: unknown) => this.error(`${prefix} ${message}`, extra),
    };
  }

  // ---------------------------------------------------------------------------
  // Flush — emit all buffered lines atomically then clear the buffer.
  // Lines are joined into a single string so that a single console.log call
  // writes them without any other process's output sneaking in between.
  // ---------------------------------------------------------------------------

  flush(): void {
    if (this.lines.length === 0) return;

    const output: string[] = [];

    for (const line of this.lines) {
      const levelPrefix = line.level === "info" ? "" : ` ${line.level.toUpperCase()}`;
      const base = `${this.prefix}${levelPrefix} ${line.message}`;
      output.push(base);

      // Append serialised extra data on the next line, indented, when present.
      if (line.extra !== undefined) {
        const serialised = serializeExtra(line.extra);
        if (serialised) {
          output.push(`  ${serialised}`);
        }
      }
    }

    // Single synchronous write — no interleaving possible within one event-loop tick.
    process.stdout.write(output.join("\n") + "\n");

    this.lines.length = 0;
  }

  // ---------------------------------------------------------------------------
  // Convenience: flush and re-throw (useful in catch blocks).
  // ---------------------------------------------------------------------------

  flushAndThrow(error: unknown): never {
    this.flush();
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function serializeExtra(extra: unknown): string {
  if (extra instanceof Error) {
    return extra.stack ?? `${extra.name}: ${extra.message}`;
  }
  try {
    return JSON.stringify(extra, null, 2);
  } catch {
    return String(extra);
  }
}