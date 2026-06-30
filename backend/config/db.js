/**
 * @file db.js
 * @description Database connection module.
 *
 * PATTERN: Singleton (via DatabaseConnection)
 * Instead of calling `mongoose.connect()` directly (which would allow multiple
 * connections on repeated requires), this module delegates to the
 * DatabaseConnection singleton. The singleton ensures that only ONE connection
 * is ever created throughout the application lifecycle.
 *
 * OOP: Uses the Singleton class's getInstance() static method — a classic
 * example of encapsulating a shared resource behind a controlled interface.
 */

const DatabaseConnection = require('../patterns/singleton/DatabaseConnection');

/**
 * Connects to MongoDB Atlas using the MONGO_URI environment variable.
 * Delegates to the DatabaseConnection singleton — repeated calls are no-ops.
 *
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  const dbInstance = DatabaseConnection.getInstance();
  await dbInstance.connect(process.env.MONGO_URI);
};

module.exports = connectDB;
