// utils/logger.ts
//
// Lightweight logging wrapper. `debug`/`info` are silenced in production builds so
// dev noise never ships; `warn`/`error` always fire (they matter for prod crash logs
// and remote logging services). Swap the bodies here to route to Sentry/etc. later
// without touching call sites.

/* eslint-disable no-console */

export const logger = {
  debug(...args: unknown[]): void {
    if (__DEV__) console.log(...args);
  },
  info(...args: unknown[]): void {
    if (__DEV__) console.info(...args);
  },
  warn(...args: unknown[]): void {
    console.warn(...args);
  },
  error(...args: unknown[]): void {
    console.error(...args);
  },
};

export default logger;
