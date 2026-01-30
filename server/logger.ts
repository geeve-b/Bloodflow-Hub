const LEVELS = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
} as const;

const levelFromEnv = (process.env.LOG_LEVEL || "").toLowerCase() as keyof typeof LEVELS;
const defaultLevel: keyof typeof LEVELS = "info";
const ACTIVE_LEVEL = LEVELS[levelFromEnv] !== undefined ? levelFromEnv : defaultLevel;

const ORIGINAL = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

type LevelKey = keyof typeof LEVELS;

function shouldLog(level: LevelKey): boolean {
  return LEVELS[level] <= LEVELS[ACTIVE_LEVEL];
}

function detectLevel(args: unknown[]): LevelKey {
  const [first] = args;
  if (typeof first === "string") {
    if (first.includes("[DEBUG]")) return "debug";
    if (first.includes("[WARN]") || first.includes("[WARNING]")) return "warn";
    if (first.includes("[ERROR]")) return "error";
    if (first.includes("[INFO]") || first.includes("[ScheduledTasks]") || first.includes("[WS]")) return "info";
  }
  return "info";
}

console.log = (...args: unknown[]) => {
  const detected = detectLevel(args);
  if (!shouldLog(detected)) {
    return;
  }
  ORIGINAL.log(...args);
};

console.info = (...args: unknown[]) => {
  if (!shouldLog("info")) {
    return;
  }
  ORIGINAL.info(...args);
};

console.warn = (...args: unknown[]) => {
  if (!shouldLog("warn")) {
    return;
  }
  ORIGINAL.warn(...args);
};

console.error = (...args: unknown[]) => {
  if (!shouldLog("error")) {
    return;
  }
  ORIGINAL.error(...args);
};

export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog("debug")) {
      ORIGINAL.log(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (shouldLog("info")) {
      ORIGINAL.info(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (shouldLog("warn")) {
      ORIGINAL.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    ORIGINAL.error(...args);
  },
  level: ACTIVE_LEVEL,
};
