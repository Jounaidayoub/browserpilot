function parseDebugFlag(value: string | undefined): boolean {
  if (!value) return false;
  return ["1", "true", "yes", "on", "*"].includes(value.toLowerCase());
}

let debugEnabled = parseDebugFlag(process.env.BROWSERPILOT_DEBUG) || parseDebugFlag(process.env.DEBUG);

export function setLogLevel(debug: boolean): void {
  debugEnabled = debug;
}

export function isDebugEnabled(): boolean {
  return debugEnabled;
}

export function debugLog(...args: unknown[]): void {
  if (isDebugEnabled()) {
    console.log(...args);
  }
}

export function debugError(...args: unknown[]): void {
  if (isDebugEnabled()) {
    console.error(...args);
  }
}
