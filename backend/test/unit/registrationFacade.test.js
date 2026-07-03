/**
 * @file registrationFacade.test.js
 * @description UNIT tests for the Facade pattern (RegistrationFacade).
 *
 * The facade orchestrates the Course model, the Enrollment model and the
 * Observer emitter. To test it as a *unit* (not an integration), every one of
 * those collaborators is replaced with a Sinon stub — so NO real MongoDB call is
 * made. The tests assert the facade's orchestration logic: the right steps run
 * in the right order, and the correct errors (with statusCode) are thrown on the
 * failure branches.
 */

const { expect } = require('chai');
const sinon = require('sinon');

const Course     = require('../../models/Course');
const Enrollment = require('../../models/Enrollment');
const emitter    = require('../../patterns/observer/EnrollmentEventEmitter');
const facade     = require('../../patterns/facade/RegistrationFacade');

const STUDENT_ID = 'student-1';
const COURSE_ID  = 'course-1';
const STUDENT    = { name: 'Ada', email: 'ada@x.com' };

// A fake Mongoose course document with a stubbed save().
const fakeCourse = (over = {}) => ({
  _id:      COURSE_ID,
  title:    'Cloud 101',
  capacity: 25,
  enrolled: 0,
  save:     sinon.stub().resolvesThis(),
  ...over,
});

describe('UNIT: RegistrationFacade.enrollStudent()', () => {

  afterEach(() => sinon.restore());

  it('runs the full happy-path workflow and returns the new enrollment', async () => {
    const course = fakeCourse({ enrolled: 5 });
    sinon.stub(Course, 'findById').resolves(course);
    sinon.stub(Enrollment, 'findOne').resolves(null); // no duplicate
    const created = { _id: 'enr-1', student: STUDENT_ID, course: COURSE_ID };
    sinon.stub(Enrollment, 'create').resolves(created);
    const notify = sinon.stub(emitter, 'notifyEnrollment');

    const result = await facade.enrollStudent(STUDENT_ID, STUDENT, COURSE_ID);

    expect(result).to.equal(created);
    expect(Enrollment.create.calledOnceWith({ student: STUDENT_ID, course: COURSE_ID })).to.equal(true);
    expect(course.enrolled).to.equal(6);         // counter incremented
    expect(course.save.calledOnce).to.equal(true);
    expect(notify.calledOnce).to.equal(true);    // observer fired
  });

  it('throws 404 when the course does not exist', async () => {
    sinon.stub(Course, 'findById').resolves(null);

    try {
      await facade.enrollStudent(STUDENT_ID, STUDENT, COURSE_ID);
      expect.fail('expected enrollStudent to throw');
    } catch (err) {
      expect(err.message).to.equal('Course not found');
      expect(err.statusCode).to.equal(404);
    }
  });

  it('throws 400 "Course is full" when at capacity and does not create an enrollment', async () => {
    sinon.stub(Course, 'findById').resolves(fakeCourse({ capacity: 1, enrolled: 1 }));
    const create = sinon.stub(Enrollment, 'create');
    sinon.stub(emitter, 'notifyCourseFull'); // suppress observer side-effect

    try {
      await facade.enrollStudent(STUDENT_ID, STUDENT, COURSE_ID);
      expect.fail('expected enrollStudent to throw');
    } catch (err) {
      expect(err.message).to.equal('Course is full');
      expect(err.statusCode).to.equal(400);
    }
    expect(create.called).to.equal(false);
  });

  it('throws 400 when the student is already enrolled (duplicate)', async () => {
    sinon.stub(Course, 'findById').resolves(fakeCourse({ enrolled: 2 }));
    sinon.stub(Enrollment, 'findOne').resolves({ _id: 'existing' }); // duplicate found
    const create = sinon.stub(Enrollment, 'create');

    try {
      await facade.enrollStudent(STUDENT_ID, STUDENT, COURSE_ID);
      expect.fail('expected enrollStudent to throw');
    } catch (err) {
      expect(err.message).to.equal('Already enrolled in this course');
      expect(err.statusCode).to.equal(400);
    }
    expect(create.called).to.equal(false);
  });
});

describe('UNIT: RegistrationFacade.dropStudent()', () => {

  afterEach(() => sinon.restore());

  it('deletes the enrollment, decrements the counter and fires the drop event', async () => {
    const deleted = { _id: 'enr-1', student: STUDENT_ID, course: COURSE_ID };
    sinon.stub(Enrollment, 'findOneAndDelete').resolves(deleted);
    const course = fakeCourse({ enrolled: 3 });
    sinon.stub(Course, 'findById').resolves(course);
    const notify = sinon.stub(emitter, 'notifyDropped');

    const result = await facade.dropStudent(STUDENT_ID, STUDENT, COURSE_ID);

    expect(result).to.equal(deleted);
    expect(course.enrolled).to.equal(2);       // decremented
    expect(course.save.calledOnce).to.equal(true);
    expect(notify.calledOnce).to.equal(true);
  });

  it('throws 404 when the enrollment to drop is not found', async () => {
    sinon.stub(Enrollment, 'findOneAndDelete').resolves(null);

    try {
      await facade.dropStudent(STUDENT_ID, STUDENT, COURSE_ID);
      expect.fail('expected dropStudent to throw');
    } catch (err) {
      expect(err.message).to.equal('Enrollment not found');
      expect(err.statusCode).to.equal(404);
    }
  });

  it('never lets the enrolled counter go below zero', async () => {
    sinon.stub(Enrollment, 'findOneAndDelete').resolves({ _id: 'enr-1' });
    const course = fakeCourse({ enrolled: 0 });
    sinon.stub(Course, 'findById').resolves(course);
    sinon.stub(emitter, 'notifyDropped');

    await facade.dropStudent(STUDENT_ID, STUDENT, COURSE_ID);

    expect(course.enrolled).to.equal(0);       // stays at 0, not -1
    expect(course.save.called).to.equal(false); // no save when nothing to decrement
  });
});
