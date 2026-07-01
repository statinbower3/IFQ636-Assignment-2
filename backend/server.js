/**
 * @file server.js
 * @description Express application entry point.
 *
 * PATTERN: Chain of Responsibility (request pipeline)
 * The global middleware chain (LoggingHandler → SanitizationHandler) is built
 * using the Chain of Responsibility pattern. Every incoming HTTP request passes
 * through each handler in order before reaching the route handlers.
 *
 * PATTERN: Singleton (database connection)
 * `connectDB()` delegates to the DatabaseConnection singleton, ensuring only
 * one MongoDB connection is opened regardless of how many modules call it.
 *
 * OOP: The chain handlers are OOP classes with a shared interface — they can
 * be composed, reordered, or replaced without touching the server setup.
 */

const path       = require('path');
const express    = require('express');
const dotenv     = require('dotenv');
const cors       = require('cors');
const connectDB  = require('./config/db');

// ─── Pattern: Chain of Responsibility ─────────────────────────────────────────
const {
  LoggingHandler,
  SanitizationHandler,
  buildChain,
} = require('./patterns/chain/RequestChain');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// ─── Standard Express Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Global Chain of Responsibility middleware ─────────────────────────────────
// Every request passes through: Logger → Sanitizer → Express continues.
// New steps can be added to the array without modifying existing handlers.
app.use(
  buildChain([
    new LoggingHandler(),       // Step 1: Log method, URL, timestamp, IP
    new SanitizationHandler(),  // Step 2: Trim whitespace from req.body strings
  ])
);

// ─── Route Mounting ────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/authRoutes'));
app.use('/api/courses',     require('./routes/courseRoutes'));
app.use('/api/enrollments', require('./routes/enrollmentRoutes'));

// ─── Server Start ──────────────────────────────────────────────────────────────
// Guard: only start listening when the file is run directly (not when required
// by the test suite — tests import `app` without starting a server).
if (require.main === module) {
  connectDB(); // Pattern: Singleton — ensures one DB connection
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => console.log(`[Server] Running on port ${PORT}`));
}

module.exports = app;