/**
 * @file enrollmentEventEmitter.test.js
 * @description UNIT tests for the Observer pattern (EnrollmentEventEmitter).
 *
 * The emitter is a shared singleton that extends Node's EventEmitter. These
 * tests attach their own spy observers, fire the notify* helpers, and assert the
 * observers receive the correct payloads — then detach cleanly so no test leaks
 * listeners into another. Sinon spies stand in for real subscribers (loggers,
 * email notifiers), keeping the test fully isolated.
 */

const { expect } = require('chai');
const sinon = require('sinon');

const emitter = require('../../patterns/observer/EnrollmentEventEmitter');

describe('UNIT: EnrollmentEventEmitter (Observer pattern)', () => {

  let spy;

  afterEach(() => {
    // Detach any listener added during a test to avoid cross-test leakage.
    if (spy) {
      emitter.unsubscribe('enrollment:created', spy);
      emitter.unsubscribe('enrollment:dropped', spy);
      emitter.unsubscribe('course:full', spy);
      spy = null;
    }
  });

  it('notifyEnrollment() delivers the payload to a subscribed observer', () => {
    spy = sinon.spy();
    emitter.subscribe('enrollment:created', spy);

    const payload = { studentName: 'Ada', studentEmail: 'ada@x.com', courseName: 'Cloud 101' };
    emitter.notifyEnrollment(payload);

    expect(spy.calledOnce).to.equal(true);
    expect(spy.firstCall.args[0]).to.deep.equal(payload);
  });

  it('notifyDropped() delivers the payload to a subscribed observer', () => {
    spy = sinon.spy();
    emitter.subscribe('enrollment:dropped', spy);

    emitter.notifyDropped({ studentName: 'Grace', studentEmail: 'g@x.com', courseName: 'Cloud 101' });

    expect(spy.calledOnce).to.equal(true);
    expect(spy.firstCall.args[0].courseName).to.equal('Cloud 101');
  });

  it('notifyCourseFull() delivers the payload to a subscribed observer', () => {
    spy = sinon.spy();
    emitter.subscribe('course:full', spy);

    emitter.notifyCourseFull({ courseName: 'Cloud 101', capacity: 25 });

    expect(spy.calledOnce).to.equal(true);
    expect(spy.firstCall.args[0].capacity).to.equal(25);
  });

  it('supports multiple observers for the same event (one-to-many broadcast)', () => {
    const a = sinon.spy();
    const b = sinon.spy();
    emitter.subscribe('enrollment:created', a);
    emitter.subscribe('enrollment:created', b);

    emitter.notifyEnrollment({ studentName: 'X', studentEmail: 'x@x.com', courseName: 'C' });

    expect(a.calledOnce).to.equal(true);
    expect(b.calledOnce).to.equal(true);

    emitter.unsubscribe('enrollment:created', a);
    emitter.unsubscribe('enrollment:created', b);
  });

  it('unsubscribe() stops an observer from receiving further events', () => {
    const observer = sinon.spy();
    emitter.subscribe('enrollment:created', observer);
    emitter.unsubscribe('enrollment:created', observer);

    emitter.notifyEnrollment({ studentName: 'X', studentEmail: 'x@x.com', courseName: 'C' });

    expect(observer.called).to.equal(false);
  });
});
