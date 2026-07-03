/**
 * @file oop.test.js
 * @description UNIT tests for the OOP domain classes: BaseUser, AdminUser, StudentUser.
 *
 * These are pure, isolated unit tests — no database, no HTTP, no external services.
 * They verify the four OOP concepts the classes are designed to demonstrate:
 *   - Encapsulation (private #role, protected-by-convention fields)
 *   - Inheritance   (subclasses inherit shared behaviour)
 *   - Polymorphism  (overridden getPermissions() / describe(), overloaded trackEnrollment())
 *   - Abstraction   (abstract getPermissions() throws on the base class)
 */

const { expect } = require('chai');

const BaseUser    = require('../../oop/BaseUser');
const AdminUser   = require('../../oop/AdminUser');
const StudentUser = require('../../oop/StudentUser');

describe('UNIT: BaseUser', () => {

  const data = {
    id:         'u1',
    name:       'Ada Lovelace',
    email:      'ada@example.com',
    role:       'student',
    university: 'QUT',
  };

  it('assigns constructor fields correctly', () => {
    const u = new BaseUser(data);
    expect(u.id).to.equal('u1');
    expect(u.name).to.equal('Ada Lovelace');
    expect(u.email).to.equal('ada@example.com');
    expect(u.university).to.equal('QUT');
  });

  it('defaults university to null when not supplied', () => {
    const u = new BaseUser({ id: 'x', name: 'N', email: 'e', role: 'student' });
    expect(u.university).to.equal(null);
  });

  it('exposes role only through a read-only getter (encapsulation)', () => {
    const u = new BaseUser(data);
    expect(u.role).to.equal('student');
    // The backing field is private (#role) with a getter but no setter, so an
    // external assignment is silently ignored — the role cannot be mutated.
    u.role = 'admin';
    expect(u.role).to.equal('student');
  });

  it('throws when getPermissions() is called on the abstract base (abstraction)', () => {
    const u = new BaseUser(data);
    expect(() => u.getPermissions()).to.throw(/must be implemented by subclass/);
  });

  it('describe() returns a readable base description', () => {
    const u = new BaseUser(data);
    expect(u.describe()).to.equal('User: Ada Lovelace <ada@example.com> [role: student]');
  });

  it('toJSON() omits any password field and includes role', () => {
    const u = new BaseUser(data);
    const json = u.toJSON();
    expect(json).to.deep.equal({
      id:         'u1',
      name:       'Ada Lovelace',
      email:      'ada@example.com',
      role:       'student',
      university: 'QUT',
    });
    expect(json).to.not.have.property('password');
  });
});

describe('UNIT: AdminUser', () => {

  const data = { id: 'a1', name: 'Root', email: 'root@example.com' };

  it('is an instance of BaseUser (inheritance)', () => {
    expect(new AdminUser(data)).to.be.an.instanceOf(BaseUser);
  });

  it('forces the role to "admin" regardless of input', () => {
    const u = new AdminUser({ ...data, role: 'student' });
    expect(u.role).to.equal('admin');
  });

  it('overrides getPermissions() with the full admin permission set (polymorphism)', () => {
    const perms = new AdminUser(data).getPermissions();
    expect(perms).to.include.members([
      'create_course', 'update_course', 'delete_course',
      'view_all_enrollments', 'manage_users',
    ]);
  });

  it('inherits hasPermission() from BaseUser and evaluates it against admin perms', () => {
    const u = new AdminUser(data);
    expect(u.hasPermission('delete_course')).to.equal(true);
    expect(u.hasPermission('some_made_up_permission')).to.equal(false);
  });

  it('overrides describe() with an admin-specific string', () => {
    const u = new AdminUser({ ...data, adminLevel: 2 });
    expect(u.describe()).to.equal('Admin: Root <root@example.com> [admin level: 2]');
  });

  it('isSuperAdmin() reflects the admin level (defaults to level 1 = false)', () => {
    expect(new AdminUser(data).isSuperAdmin()).to.equal(false);
    expect(new AdminUser({ ...data, adminLevel: 2 }).isSuperAdmin()).to.equal(true);
  });
});

describe('UNIT: StudentUser', () => {

  const data = { id: 's1', name: 'Grace', email: 'grace@example.com' };

  it('is an instance of BaseUser (inheritance)', () => {
    expect(new StudentUser(data)).to.be.an.instanceOf(BaseUser);
  });

  it('forces the role to "student"', () => {
    const u = new StudentUser({ ...data, role: 'admin' });
    expect(u.role).to.equal('student');
  });

  it('overrides getPermissions() with the restricted student set (polymorphism)', () => {
    const perms = new StudentUser(data).getPermissions();
    expect(perms).to.have.members([
      'enroll_course', 'drop_course', 'view_courses', 'view_my_enrollments',
    ]);
    expect(perms).to.not.include('create_course');
  });

  it('starts with zero tracked enrollments', () => {
    expect(new StudentUser(data).getEnrolledCount()).to.equal(0);
  });

  it('trackEnrollment() accepts a single course id (overload 1)', () => {
    const u = new StudentUser(data);
    u.trackEnrollment('course-123');
    expect(u.getEnrolledCount()).to.equal(1);
    expect(u.getEnrolledCourseIds()).to.deep.equal(['course-123']);
  });

  it('trackEnrollment() accepts an array of course ids (overload 2)', () => {
    const u = new StudentUser(data);
    u.trackEnrollment(['c1', 'c2', 'c3']);
    expect(u.getEnrolledCount()).to.equal(3);
  });

  it('trackEnrollment() throws a TypeError on unsupported input', () => {
    const u = new StudentUser(data);
    expect(() => u.trackEnrollment(42)).to.throw(TypeError);
  });

  it('getEnrolledCourseIds() returns a copy, not the internal array (encapsulation)', () => {
    const u = new StudentUser(data);
    u.trackEnrollment('c1');
    const ids = u.getEnrolledCourseIds();
    ids.push('tampered');
    // Mutating the returned array must not affect the student's internal state.
    expect(u.getEnrolledCount()).to.equal(1);
  });

  it('describe() reflects the current enrollment count', () => {
    const u = new StudentUser(data);
    u.trackEnrollment(['c1', 'c2']);
    expect(u.describe()).to.equal('Student: Grace <grace@example.com> [enrolled in 2 course(s)]');
  });
});
