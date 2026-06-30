/**
 * @file authMiddleware.js
 * @description JWT authentication middleware built on the Chain of Responsibility pattern.
 *
 * PATTERN: Chain of Responsibility
 * The `protect` middleware is assembled from three chained handlers:
 *   1. TokenExtractionHandler  — extracts the Bearer token from the Authorization header.
 *   2. TokenVerificationHandler — verifies and decodes the JWT.
 *   3. UserFetchHandler         — loads the full user document from MongoDB.
 *
 * Each handler either continues the chain (success) or short-circuits with an
 * HTTP error response (failure). Adding a new step (e.g. a rate-limiter) only
 * requires inserting a new handler — no existing code changes.
 *
 * OOP CONCEPTS:
 *  - Class       : Three concrete handler classes + adminOnly guard.
 *  - Inheritance : All handlers extend the RequestHandler base class from RequestChain.js.
 *  - Encapsulation: Token extraction / verification / user lookup are hidden inside
 *                   their respective handler classes.
 *  - Polymorphism : Each handler overrides `handle()` with different logic while sharing
 *                   the same method signature (method overriding).
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Import the base handler and chain builder from our CoR pattern module.
const { RequestHandler, buildChain } = require('../patterns/chain/RequestChain');

// ─── Handler 1: Token Extraction ─────────────────────────────────────────────

/**
 * Extracts the Bearer token from the Authorization header.
 * Stores it on `req._token` for the next handler to use.
 * Short-circuits with 401 if no token is found.
 *
 * @extends RequestHandler
 */
class TokenExtractionHandler extends RequestHandler {
  /**
   * @override
   */
  async handle(req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      req._token = authHeader.split(' ')[1]; // store on request for next handler
      return await super.handle(req, res, next); // continue chain
    }

    // Short-circuit: no token present.
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
}

// ─── Handler 2: Token Verification ───────────────────────────────────────────

/**
 * Verifies the JWT extracted by TokenExtractionHandler.
 * Stores the decoded user ID on `req._decodedId` for the next handler.
 * Short-circuits with 401 if the token is invalid or expired.
 *
 * @extends RequestHandler
 */
class TokenVerificationHandler extends RequestHandler {
  /**
   * @override
   */
  async handle(req, res, next) {
    try {
      const decoded   = jwt.verify(req._token, process.env.JWT_SECRET);
      req._decodedId  = decoded.id; // pass decoded ID to next handler
      return await super.handle(req, res, next); // continue chain
    } catch (error) {
      // Short-circuit: invalid or expired token.
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
}

// ─── Handler 3: User Fetcher ──────────────────────────────────────────────────

/**
 * Loads the full User document from MongoDB using the decoded ID.
 * Attaches it to `req.user` (without the password field) so downstream
 * controllers can access the authenticated user.
 * Short-circuits with 401 if the user no longer exists.
 *
 * @extends RequestHandler
 */
class UserFetchHandler extends RequestHandler {
  /**
   * @override
   */
  async handle(req, res, next) {
    req.user = await User.findById(req._decodedId).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    return await super.handle(req, res, next); // continue to route handler
  }
}

// ─── Assembled Middleware ──────────────────────────────────────────────────────

/**
 * `protect` — the assembled authentication chain.
 * Combines TokenExtractionHandler → TokenVerificationHandler → UserFetchHandler.
 * Used as middleware on any route that requires a logged-in user.
 *
 * @type {Function} Express middleware (req, res, next) => void
 */
const protect = buildChain([
  new TokenExtractionHandler(),
  new TokenVerificationHandler(),
  new UserFetchHandler(),
]);

// ─── Admin Guard ──────────────────────────────────────────────────────────────

/**
 * `adminOnly` — a simple role-check middleware (not a chain handler).
 * Must be used AFTER `protect` so that `req.user` is already populated.
 * Returns 403 if the authenticated user is not an admin.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {Function}                   next
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Admins only.' });
};

module.exports = { protect, adminOnly };
