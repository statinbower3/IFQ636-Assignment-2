/**
 * @file AdminUser.js
 * @description Concrete subclass of BaseUser representing an administrator.
 *
 * OOP CONCEPTS DEMONSTRATED:
 *  - Inheritance  : `AdminUser extends BaseUser` — inherits id, name, email,
 *                   hasPermission(), toJSON(), etc.
 *  - Polymorphism : Overrides `getPermissions()` and `describe()` (method overriding).
 *  - Encapsulation: `_adminLevel` uses a protected-by-convention prefix `_`
 *                   to signal it should not be modified externally.
 */

const BaseUser = require('./BaseUser');

class AdminUser extends BaseUser {
  // ─── Constructor ────────────────────────────────────────────────────────────

  /**
   * @param {Object} userData              - Raw user data passed through from UserFactory.
   * @param {number} [userData.adminLevel] - Optional admin privilege level (1 = standard).
   */
  constructor(userData) {
    // Call parent constructor; force role to 'admin' regardless of input.
    super({ ...userData, role: 'admin' });

    /**
     * @protected {number} _adminLevel
     * Represents the privilege tier of this admin (e.g. 1 = standard, 2 = super-admin).
     * Uses protected-by-convention naming (`_`) to signal it is internal state.
     */
    this._adminLevel = userData.adminLevel || 1;
  }

  // ─── Method Overriding (Polymorphism) ───────────────────────────────────────

  /**
   * Returns the full set of permissions available to an administrator.
   * OVERRIDES BaseUser.getPermissions().
   *
   * @override
   * @returns {string[]}
   */
  getPermissions() {
    return [
      'create_course',
      'update_course',
      'delete_course',
      'view_all_enrollments',
      'manage_users',
      'enroll_course',   // Admins can also enrol (needed for capacity-test fixture)
      'drop_course',
      'view_courses',
      'view_my_enrollments',
    ];
  }

  /**
   * Returns an admin-specific description string.
   * OVERRIDES BaseUser.describe().
   *
   * @override
   * @returns {string}
   */
  describe() {
    return `Admin: ${this.name} <${this.email}> [admin level: ${this._adminLevel}]`;
  }

  // ─── Admin-specific methods ──────────────────────────────────────────────────

  /**
   * Returns true if this admin has super-admin privileges (level ≥ 2).
   *
   * @returns {boolean}
   */
  isSuperAdmin() {
    return this._adminLevel >= 2;
  }
}

module.exports = AdminUser;
