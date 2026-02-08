/**
 * Custom logger that works in both debug and release builds
 * Uses native logging that persists in logcat
 */

class Logger {
  private static instance: Logger;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log to native logcat (Android) / NSLog (iOS)
   * This works even in release builds
   */
  private nativeLog(level: string, tag: string, message: string, data?: any) {
    const formattedMessage = data
      ? `${tag} ${message} ${JSON.stringify(data)}`
      : `${tag} ${message}`;

    // Always use console methods which get bridged to native logs
    // These persist in logcat even in release builds
    if (level === 'error') {
      console.error(formattedMessage);
    } else if (level === 'warn') {
      console.warn(formattedMessage);
    } else {
      console.info(formattedMessage);
    }
  }

  log(tag: string, message: string, data?: any) {
    this.nativeLog('info', tag, message, data);
  }

  info(tag: string, message: string, data?: any) {
    this.nativeLog('info', tag, message, data);
  }

  warn(tag: string, message: string, data?: any) {
    this.nativeLog('warn', tag, message, data);
  }

  error(tag: string, message: string, data?: any) {
    this.nativeLog('error', tag, message, data);
  }
}

export const logger = Logger.getInstance();

// Convenience exports
export const logInfo = (tag: string, message: string, data?: any) =>
  logger.info(tag, message, data);

export const logError = (tag: string, message: string, data?: any) =>
  logger.error(tag, message, data);

export const logWarn = (tag: string, message: string, data?: any) =>
  logger.warn(tag, message, data);
