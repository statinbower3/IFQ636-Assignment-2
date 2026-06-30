/**
 * @file User.js
 * @description Mongoose schema and model for a system user.
 *
 * OOP CONCEPTS:
 *  - Encapsulation: The `password` field is never returned in queries by default.
 *                   The pre-save hook hides the hashing logic — callers simply
 *                   set `user.password = plainText` and the model handles the rest.
 *
 * The role field ('student' | 'admin') drives the Factory pattern:
 * UserFactory reads this field to decide which domain class to instantiate.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const userSchema = new mongoose.Schema({
  /** User's full display name. */
  name:       { type: String, required: true },

  /** Email address — used as the unique login identifier. */
  email:      { type: String, required: true, unique: true },

  /** Bcrypt-hashed password — plain-text is never stored. */
  password:   { type: String, required: true },

  /** Optional university affiliation displayed on the profile. */
  university: { type: String },

  /** Optional mailing/physical address displayed on the profile. */
  address:    { type: String },

  /**
   * Role that determines what the user can do.
   * Drives the Factory pattern — UserFactory maps this to AdminUser or StudentUser.
   */
  role: {
    type:    String,
    enum:    ['student', 'admin'],
    default: 'student',
  },
});

/**
 * Pre-save hook — hashes the plain-text password before persisting.
 * Only runs when `password` has been modified (avoids re-hashing on profile updates).
 *
 * OOP / Encapsulation: The hashing algorithm is hidden from all callers.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt    = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);
