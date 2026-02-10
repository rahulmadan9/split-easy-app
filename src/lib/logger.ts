/**
 * Production-safe logger that only outputs to console in development mode.
 * Prevents information leakage about database structure and internal errors.
 */
export const logger = {
  error: (message: string, error?: unknown) => {
    if (import.meta.env.DEV) {
      console.error(message, error);
    }
    // In production, errors are silently handled
    // Add monitoring service integration here if needed (Sentry, LogRocket, etc.)
  },
  warn: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.warn(message, data);
    }
  },
  info: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.info(message, data);
    }
  },
  debug: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.debug(message, data);
    }
  }
};
