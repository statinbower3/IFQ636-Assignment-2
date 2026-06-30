/**
 * @file RequestChain.js
 * @description Implements the **Chain of Responsibility** design pattern
 *              for Express middleware processing.
 *
 * PATTERN: Chain of Responsibility
 * PURPOSE: Each handler in the chain either handles part of the incoming
 *          request (logging, sanitisation, validation) and passes it to
 *          the next handler, OR short-circuits the chain by sending an
 *          error response. Handlers are completely independent — adding a
 *          new step requires no changes to existing handlers.
 *
 * CHAIN USED IN THIS APP:
 *   LoggingHandler → SanitizationHandler → (Express continues)
 *
 * OOP CONCEPTS USED:
 *  - Class       : Abstract RequestHandler base + three concrete subclasses.
 *  - Inheritance : Concrete handlers extend RequestHandler and call super.handle().
 *  - Encapsulation: Each handler hides its processing logic; callers only see `handle()`.
 *  - Polymorphism : `handle()` has the same signature across all handlers but
 *                   performs different work in each (method overriding).
 *
 * USAGE (in server.js):
 *   const { LoggingHandler, SanitizationHandler, buildChain } = require('./patterns/chain/RequestChain');
 *   app.use(buildChain([ new LoggingHandler(), new SanitizationHandler() ]));
 */

// ─── Abstract Base Handler ────────────────────────────────────────────────────

/**
 * Abstract handler base class.
 * Each concrete handler stores a reference to the next handler in the chain
 * and calls `super.handle()` to delegate once its own work is done.
 */
class RequestHandler {
  constructor() {
    /** @private {RequestHandler|null} The next handler in the chain. */
    this._nextHandler = null;
  }

  /**
   * Sets the next handler and returns it (fluent / builder interface).
   *
   * @param {RequestHandler} handler - The next handler.
   * @returns {RequestHandler} The handler passed in (enables chaining).
   */
  setNext(handler) {
    this._nextHandler = handler;
    return handler; // fluent: h1.setNext(h2).setNext(h3)
  }

  /**
   * Processes the request. If this handler has no more work to do for this
   * step, it delegates to the next handler, or calls next() if at the end.
   *
   * Subclasses MUST call `super.handle(req, res, next)` after their own logic
   * to continue the chain.
   *
   * @param {import('express').Request}  req
   * @param {import('express').Response} res
   * @param {Function}                   next - Express next() function.
   * @returns {Promise<void>}
   */
  async handle(req, res, next) {
    if (this._nextHandler) {
      return await this._nextHandler.handle(req, res, next);
    }
    // End of chain — hand off to Express.
    return next();
  }
}

// ─── Concrete Handler 1: Logging ─────────────────────────────────────────────

/**
 * Logs every incoming request: method, URL, IP, and timestamp.
 * Always passes the request to the next handler.
 *
 * @extends RequestHandler
 */
class LoggingHandler extends RequestHandler {
  /**
   * @override
   * @param {import('express').Request}  req
   * @param {import('express').Response} res
   * @param {Function}                   next
   */
  async handle(req, res, next) {
    const timestamp = new Date().toISOString();
    console.log(
      `[Chain:Logger] [${timestamp}] ${req.method} ${req.originalUrl} ← IP: ${req.ip}`
    );
    // Pass to next handler in the chain.
    return await super.handle(req, res, next);
  }
}

// ─── Concrete Handler 2: Input Sanitisation ───────────────────────────────────

/**
 * Trims whitespace from all string values in the request body.
 * Prevents accidental leading/trailing spaces causing lookup failures.
 * Always passes the request to the next handler.
 *
 * @extends RequestHandler
 */
class SanitizationHandler extends RequestHandler {
  /**
   * @override
   * @param {import('express').Request}  req
   * @param {import('express').Response} res
   * @param {Function}                   next
   */
  async handle(req, res, next) {
    if (req.body && typeof req.body === 'object') {
      Object.keys(req.body).forEach((key) => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key].trim();
        }
      });
    }
    console.log(`[Chain:Sanitizer] Input sanitised for ${req.method} ${req.originalUrl}`);
    return await super.handle(req, res, next);
  }
}

// ─── Concrete Handler 3: Field Validation ─────────────────────────────────────

/**
 * Validates that required fields are present in the request body.
 * Short-circuits the chain with a 400 response if any required field is missing.
 *
 * @extends RequestHandler
 */
class ValidationHandler extends RequestHandler {
  /**
   * @param {string[]} requiredFields - Field names that must be present in req.body.
   */
  constructor(requiredFields = []) {
    super();
    /** @private {string[]} */
    this._requiredFields = requiredFields;
  }

  /**
   * @override
   * @param {import('express').Request}  req
   * @param {import('express').Response} res
   * @param {Function}                   next
   */
  async handle(req, res, next) {
    // Only validate POST/PUT requests that carry a body.
    if (this._requiredFields.length > 0 && ['POST', 'PUT'].includes(req.method)) {
      const missing = this._requiredFields.filter(
        (field) => req.body[field] === undefined || req.body[field] === ''
      );
      if (missing.length > 0) {
        // Short-circuit — do NOT call super.handle() — stops the chain.
        return res.status(400).json({
          message: `Missing required fields: ${missing.join(', ')}`,
        });
      }
    }
    console.log(`[Chain:Validator] Validation passed for ${req.method} ${req.originalUrl}`);
    return await super.handle(req, res, next);
  }
}

// ─── Chain Builder Helper ─────────────────────────────────────────────────────

/**
 * Links an array of handlers into a chain and returns a single Express middleware function.
 *
 * @param {RequestHandler[]} handlers - Ordered list of handlers (first = entry point).
 * @returns {Function} An Express middleware (req, res, next) => void.
 */
const buildChain = (handlers) => {
  if (handlers.length === 0) {
    throw new Error('buildChain requires at least one handler.');
  }
  // Link each handler to the next one.
  for (let i = 0; i < handlers.length - 1; i++) {
    handlers[i].setNext(handlers[i + 1]);
  }
  // Return as a plain Express middleware.
  return (req, res, next) => handlers[0].handle(req, res, next);
};

module.exports = {
  RequestHandler,
  LoggingHandler,
  SanitizationHandler,
  ValidationHandler,
  buildChain,
};
