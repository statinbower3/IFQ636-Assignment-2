/**
 * @file UserFactory.js
 * @description Implements the **Factory** design pattern for user domain objects.
 *
 * PATTERN: Factory (also known as Factory Method)
 * PURPOSE: Centralises the creation logic for user objects so that callers
 *          never need to know which concrete class to instantiate. Providing a
 *          `role` is enough — the factory decides whether to create an
 *          `AdminUser` or a `StudentUser`.
 *
 * OOP CONCEPTS USED:
 *  - Class       : Static factory class with a single responsibility.
 *  - Polymorphism: Returns different subclass instances (AdminUser / StudentUser)
 *                  through the shared BaseUser interface, so callers work
 *                  with `.getPermissions()` and `.describe()` without caring
 *                  about the concrete type.
 *
 * USAGE:
 *   const userObj = UserFactory.createUser({ id, name, email, role: 'admin' });
 *   console.log(userObj.describe());          // "Admin: ..."
 *   console.log(userObj.getPermissions());    // ['create_course', ...]
 */

const AdminUser   = require('../../oop/AdminUser');
const StudentUser = require('../../oop/StudentUser');

class UserFactory {
  /**
   * Creates and returns the appropriate user domain object for the given role.
   *
   * @param {Object} userData       - Raw user data from the database or request.
   * @param {string} userData.id    - MongoDB document ID.
   * @param {string} userData.name  - User's full name.
   * @param {string} userData.email - User's email address.
   * @param {string} userData.role  - 'admin' | 'student' (defaults to 'student').
   * @param {string} [userData.university] - Optional university affiliation.
   *
   * @returns {AdminUser|StudentUser} The correct domain object for the given role.
   */
  static createUser(userData) {
    const { role } = userData;

    switch (role) {
      case 'admin':
        // Produce an AdminUser with elevated permissions.
        console.log(`[Factory] Creating AdminUser for: ${userData.email}`);
        return new AdminUser(userData);

      case 'student':
      default:
        // Produce a StudentUser with restricted permissions.
        // Unknown roles also fall through here as students (safe default).
        console.log(`[Factory] Creating StudentUser for: ${userData.email}`);
        return new StudentUser(userData);
    }
  }
}

module.exports = UserFactory;
