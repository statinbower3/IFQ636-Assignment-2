/**
 * @file userFactory.test.js
 * @description UNIT tests for the Factory pattern (UserFactory).
 *
 * Verifies that the factory returns the correct concrete subclass based on the
 * `role` field, and that unknown/missing roles fall back safely to a student.
 * No database or HTTP involved.
 */

const { expect } = require('chai');

const UserFactory = require('../../patterns/factory/UserFactory');
const AdminUser   = require('../../oop/AdminUser');
const StudentUser = require('../../oop/StudentUser');

describe('UNIT: UserFactory (Factory pattern)', () => {

  it('creates an AdminUser when role is "admin"', () => {
    const u = UserFactory.createUser({ id: '1', name: 'A', email: 'a@x.com', role: 'admin' });
    expect(u).to.be.an.instanceOf(AdminUser);
    expect(u.role).to.equal('admin');
  });

  it('creates a StudentUser when role is "student"', () => {
    const u = UserFactory.createUser({ id: '2', name: 'S', email: 's@x.com', role: 'student' });
    expect(u).to.be.an.instanceOf(StudentUser);
    expect(u.role).to.equal('student');
  });

  it('falls back to StudentUser for an unknown role (safe default)', () => {
    const u = UserFactory.createUser({ id: '3', name: 'U', email: 'u@x.com', role: 'wizard' });
    expect(u).to.be.an.instanceOf(StudentUser);
    expect(u.role).to.equal('student');
  });

  it('falls back to StudentUser when role is missing entirely', () => {
    const u = UserFactory.createUser({ id: '4', name: 'N', email: 'n@x.com' });
    expect(u).to.be.an.instanceOf(StudentUser);
  });

  it('produces objects that honour the shared BaseUser interface (polymorphism)', () => {
    const admin   = UserFactory.createUser({ id: '5', name: 'A', email: 'a@x.com', role: 'admin' });
    const student = UserFactory.createUser({ id: '6', name: 'S', email: 's@x.com', role: 'student' });
    // Same method name, different behaviour — the caller doesn't need to know the concrete type.
    expect(admin.getPermissions()).to.include('delete_course');
    expect(student.getPermissions()).to.not.include('delete_course');
  });
});
