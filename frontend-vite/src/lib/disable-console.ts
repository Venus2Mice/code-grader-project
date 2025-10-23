/**
 * Console Override for Production
 * 
 * Completely disables console output in production build
 * This ensures NO logs leak to client console
 */

// Only run in production
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  // Store original console methods (for internal use if needed)
  const originalConsole = {
    log: console.log,
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
    trace: console.trace,
  }

  // Override all console methods with no-op functions
  console.log = () => {}
  console.debug = () => {}
  console.info = () => {}
  console.warn = () => {}
  console.error = () => {}
  console.trace = () => {}
  console.table = () => {}
  console.group = () => {}
  console.groupEnd = () => {}
  console.time = () => {}
  console.timeEnd = () => {}

  // Optional: Add a way to restore console for debugging (remove in final production)
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.__restoreConsole = () => {
      console.log = originalConsole.log
      console.debug = originalConsole.debug
      console.info = originalConsole.info
      console.warn = originalConsole.warn
      console.error = originalConsole.error
      console.trace = originalConsole.trace
    }
  }
}

export {}
