/**
 * @file BaseUser.js
 * @description Abstract base class for all user types in the system.
 *
 * OOP CONCEPTS DEMONSTRATED:
 *  - Class        : ES6 class syntax used throughout.
 *  - Encapsulation: `#_role` uses a private field (hash prefix) so external
 *                   code cannot mutate the role directly.
 *  - Inheritance  : AdminUser and StudentUser both extend this class.
 *  - Polymorphism : `getPermissions()` and `describe()` are declared here but
 *                   overridden by each subclass (method overriding).
 *
 * NOTE: This is a *domain object* — it is not a Mongoose model. It carries the
 *       business logic for a user while the Mongoose model handles persistence.
 */

class BaseUser {
  // ─── Private field (Encapsulation) ──────────────────────────────────────────

  /** @private — role cannot be changed after construction. */
  #role;

  // ─── Constructor ────────────────────────────────────────────────────────────

  /**
   * @param {Object} userData           - Raw user data.
   * @param {string} userData.id        - MongoDB ObjectId as string.
   * @param {string} userData.name      - Full name.
   * @param {string} userData.email     - Email address.
   * @param {string} userData.role      - 'admin' or 'student'.
   * @param {string} [userData.university] - Optional university affiliation.
   */
  constructor({ id, name, email, role, university }) {
    this.id         = id;
    this.name       = name;
    this.email      = email;
    this.university = university || null;
    this.#role      = role; // stored in private field — cannot be overwritten externally
  }

  // ─── Getters ─────────────────────────────────────────────────────────────────

  /**
   * Read-only access to the role.
   *
   * @returns {string} 'admin' | 'student'
   */
  get role() {
    return this.#role;
  }

  // ─── Abstract methods (Polymorphism — must be overridden) ────────────────────

  /**
   * Returns the list of actions this user type is allowed to perform.
   * Subclasses MUST override this method (method overriding).
   *
   * @abstract
   * @returns {string[]} Array of permission strings.
   * @throws {Error} If not overridden by a subclass.
   */
  getPermissions() {
    throw new Error(`getPermissions() must be implemented by subclass of BaseUser (called on role: ${this.#role})`);
  }

  /**
   * Returns a human-readable description of this user.
   * Subclasses SHOULD override this for a role-specific description.
   *
   * @returns {string}
   */
  describe() {
    return `User: ${this.name} <${this.email}> [role: ${this.#role}]`;
  }

  // ─── Shared methods (available to all subclasses) ────────────────────────────

  /**
   * Checks whether this user holds a specific permission.
   * Works because subclasses override getPermissions().
   *
   * @param {string} action - Permission string to check.
   * @returns {boolean}
   */
  hasPermission(action) {
    return this.getPermissions().includes(action);
  }

  /**
   * Serialises the user to a plain object (safe for HTTP responses — no password).
   *
   * @returns {Object}
   */
  toJSON() {
    return {
      id:         this.id,
      name:       this.name,
      email:      this.email,
      role:       this.#role,
      university: this.university,
    };
  }
}

module.exports = BaseUser;
