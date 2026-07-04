/**
 * @file intentionalFailure.test.js
 * @description INTENTIONAL-FAILURE unit scenarios (demo).
 *
 * These tests are DESIGNED TO FAIL. They are the unit-suite counterpart to the
 * integration suite's TC-32: each one asserts something that is deliberately
 * WRONG about otherwise-correct code, proving that the unit tests genuinely
 * catch incorrect behaviour rather than passing trivially. If any of these ever
 * turns green, it means the production code has regressed to match the wrong
 * assertion.
 *
 * IMPORTANT: this file is EXCLUDED from the normal `npm run test:unit` run
 * (see the `ignore` key in .mocharc.unit.yml) so the 72-test suite stays green
 * as a CI gate. Run these on demand with:
 *
 *     npm run test:unit:demo
 *
 * Each test documents (a) the CORRECT behaviour and (b) the wrong assertion
 * made on purpose, so a reader can see exactly what a real regression would
 * look like.
 */

const { expect } = require('chai');

const UserFactory    = require('../../patterns/factory/UserFactory');
const StudentUser    = require('../../oop/StudentUser');
const { SortByCapacity } = require('../../patterns/strategy/CourseSortStrategy');

describe('UNIT (intentional failures) — demonstrates the suite catches bugs', () => {

  // ── UT-F1 ──────────────────────────────────────────────────────────────────
  it('should FAIL (by design): Factory wrongly expected to return a StudentUser for role "admin"', () => {
    // CORRECT behaviour: UserFactory.createUser({ role: 'admin' }) returns an AdminUser.
    // WRONG assertion (on purpose): we assert it returns a StudentUser.
    // → This fails, proving the test would catch a Factory that mis-maps roles.
    const user = UserFactory.createUser({ id: '1', name: 'A', email: 'a@x.com', role: 'admin' });
    expect(user).to.be.an.instanceOf(StudentUser); // deliberately wrong — it's an AdminUser
  });

  // ── UT-F2 ──────────────────────────────────────────────────────────────────
  it('should FAIL (by design): SortByCapacity wrongly expected to sort ascending', () => {
    // CORRECT behaviour: SortByCapacity sorts capacity DESCENDING → [50, 30, 10].
    // WRONG assertion (on purpose): we assert ascending order [10, 30, 50].
    // → This fails, proving the test would catch a flipped sort comparator.
    const courses = [
      { title: 'A', capacity: 10, enrolled: 0 },
      { title: 'B', capacity: 50, enrolled: 0 },
      { title: 'C', capacity: 30, enrolled: 0 },
    ];
    const sorted = new SortByCapacity().sort(courses);
    expect(sorted.map(c => c.capacity)).to.deep.equal([10, 30, 50]); // deliberately wrong — actual is [50, 30, 10]
  });

  // ── UT-F3 ──────────────────────────────────────────────────────────────────
  it('should FAIL (by design): StudentUser wrongly expected to hold the delete_course permission', () => {
    // CORRECT behaviour: a student's permissions do NOT include 'delete_course'.
    // WRONG assertion (on purpose): we assert the student CAN delete courses.
    // → This fails, proving the test would catch a privilege-escalation regression.
    const student = new StudentUser({ id: '2', name: 'S', email: 's@x.com' });
    expect(student.getPermissions()).to.include('delete_course'); // deliberately wrong — students cannot delete
  });

});
