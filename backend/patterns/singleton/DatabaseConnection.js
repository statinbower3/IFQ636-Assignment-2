/**
 * @file DatabaseConnection.js
 * @description Implements the **Singleton** design pattern for MongoDB connections.
 *
 * PATTERN: Singleton
 * PURPOSE: Guarantees that only ONE instance of the database connection exists
 *          across the entire application lifecycle. Every module that calls
 *          `DatabaseConnection.getInstance()` receives the same object, preventing
 *          multiple redundant connections to MongoDB Atlas.
 *
 * OOP CONCEPTS USED:
 *  - Class        : Encapsulates all connection logic in a single class.
 *  - Encapsulation: `_connection` is a private-by-convention property; callers
 *                   cannot set it directly — they must use `connect()`.
 */

const mongoose = require('mongoose');

class DatabaseConnection {
  /**
   * Private constructor — prevents external `new DatabaseConnection()` calls.
   * Only `getInstance()` should create the object.
   */
  constructor() {
    // Guard: if an instance already exists, return it instead of creating a new one.
    if (DatabaseConnection._instance) {
      return DatabaseConnection._instance;
    }

    /** @private {mongoose.Connection|null} The active Mongoose connection. */
    this._connection = null;

    // Cache this instance on the class so subsequent calls return it.
    DatabaseConnection._instance = this;
  }

  // ─── Static accessor ────────────────────────────────────────────────────────

  /**
   * Returns the single, shared DatabaseConnection instance.
   * Creates it on the first call; returns the cached copy on all subsequent calls.
   *
   * @returns {DatabaseConnection} The singleton instance.
   */
  static getInstance() {
    if (!DatabaseConnection._instance) {
      DatabaseConnection._instance = new DatabaseConnection();
    }
    return DatabaseConnection._instance;
  }

  // ─── Public methods ─────────────────────────────────────────────────────────

  /**
   * Connects to MongoDB using the provided URI.
   * If a connection already exists, the existing connection is reused (no-op).
   *
   * @param {string} uri - MongoDB connection string (typically from MONGO_URI env var).
   * @returns {Promise<mongoose.Connection>} The established Mongoose connection.
   */
  async connect(uri) {
    // If already connected, skip and reuse.
    if (this._connection) {
      console.log('[Singleton] Reusing existing MongoDB connection.');
      return this._connection;
    }

    try {
      this._connection = await mongoose.connect(uri);
      console.log('[Singleton] MongoDB connected successfully.');
      return this._connection;
    } catch (error) {
      console.error('[Singleton] MongoDB connection error:', error.message);
      process.exit(1); // Fatal — cannot run without a database.
    }
  }

  /**
   * Returns the raw Mongoose connection object for inspection.
   *
   * @returns {mongoose.Connection|null}
   */
  getConnection() {
    return this._connection;
  }

  /**
   * Returns true if an active connection is held.
   *
   * @returns {boolean}
   */
  isConnected() {
    return this._connection !== null;
  }
}

// Initialise the static instance slot to null.
DatabaseConnection._instance = null;

module.exports = DatabaseConnection;
