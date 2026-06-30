/**
 * @file EnrollmentEventEmitter.js
 * @description Implements the **Observer** design pattern for enrollment events.
 *
 * PATTERN: Observer (also called Publish-Subscribe)
 * PURPOSE: Decouples the enrollment logic from downstream reactions (logging,
 *          notifications, alerts). When a student enrols, is dropped, or a course
 *          fills up, the emitter broadcasts the event. Any number of *observers*
 *          (subscribers) can react independently without the enrollment code knowing
 *          about them. New observers can be added without modifying the emitter.
 *
 * OOP CONCEPTS USED:
 *  - Class       : EnrollmentEventEmitter extends Node's built-in EventEmitter.
 *  - Inheritance : Inherits `on()`, `off()`, `emit()` from EventEmitter.
 *  - Encapsulation: Internal subscriber map is hidden; callers use `subscribe()` /
 *                   `unsubscribe()` instead of raw EventEmitter methods.
 *
 * EVENTS EMITTED:
 *  - 'enrollment:created'  → fired when a student successfully enrols.
 *  - 'enrollment:dropped'  → fired when a student drops a course.
 *  - 'course:full'         → fired when a course reaches capacity.
 *
 * USAGE:
 *   const emitter = require('./EnrollmentEventEmitter');
 *   emitter.notifyEnrollment({ studentName, studentEmail, courseName });
 */

const EventEmitter = require('events');

// ─── Observer Class ───────────────────────────────────────────────────────────

class EnrollmentEventEmitter extends EventEmitter {
  constructor() {
    super(); // Inherit all EventEmitter functionality.
    console.log('[Observer] EnrollmentEventEmitter initialised.');
  }

  // ─── Subscription API (wraps raw EventEmitter methods) ───────────────────────

  /**
   * Registers an observer (handler function) for the given event.
   * Any number of handlers can subscribe to the same event.
   *
   * @param {string}   event   - Event name (e.g. 'enrollment:created').
   * @param {Function} handler - Callback that receives the event payload.
   */
  subscribe(event, handler) {
    this.on(event, handler);
    console.log(`[Observer] New subscriber registered for event: "${event}"`);
  }

  /**
   * Removes a previously registered observer.
   *
   * @param {string}   event   - Event name.
   * @param {Function} handler - The exact handler reference to remove.
   */
  unsubscribe(event, handler) {
    this.off(event, handler);
    console.log(`[Observer] Subscriber removed from event: "${event}"`);
  }

  // ─── Emit Helpers (publisher API) ────────────────────────────────────────────

  /**
   * Broadcasts an 'enrollment:created' event to all registered observers.
   *
   * @param {{ studentName: string, studentEmail: string, courseName: string }} data
   */
  notifyEnrollment(data) {
    this.emit('enrollment:created', data);
  }

  /**
   * Broadcasts an 'enrollment:dropped' event.
   *
   * @param {{ studentName: string, studentEmail: string, courseName: string }} data
   */
  notifyDropped(data) {
    this.emit('enrollment:dropped', data);
  }

  /**
   * Broadcasts a 'course:full' event when a course reaches its maximum capacity.
   *
   * @param {{ courseName: string, capacity: number }} data
   */
  notifyCourseFull(data) {
    this.emit('course:full', data);
  }
}

// ─── Singleton Instance ───────────────────────────────────────────────────────
// Export a single shared instance so all modules share the same event bus.
const enrollmentEmitter = new EnrollmentEventEmitter();

// ─── Built-in Observer 1: Audit Logger ───────────────────────────────────────
enrollmentEmitter.subscribe('enrollment:created', (data) => {
  console.log(
    `[Observer:AuditLog] ENROLLED  | Student: "${data.studentName}" ` +
    `| Course: "${data.courseName}" | Time: ${new Date().toISOString()}`
  );
});

// ─── Built-in Observer 2: Email Notifier (simulated) ─────────────────────────
enrollmentEmitter.subscribe('enrollment:created', (data) => {
  // In production this would dispatch a real email via SendGrid/SES.
  console.log(
    `[Observer:Notifier] Confirmation email queued → ${data.studentEmail} ` +
    `for course "${data.courseName}".`
  );
});

// ─── Built-in Observer 3: Drop Logger ────────────────────────────────────────
enrollmentEmitter.subscribe('enrollment:dropped', (data) => {
  console.log(
    `[Observer:AuditLog] DROPPED   | Student: "${data.studentName}" ` +
    `| Course: "${data.courseName}" | Time: ${new Date().toISOString()}`
  );
});

// ─── Built-in Observer 4: Capacity Alert ─────────────────────────────────────
enrollmentEmitter.subscribe('course:full', (data) => {
  console.log(
    `[Observer:Alert] Course "${data.courseName}" is now FULL ` +
    `(${data.capacity}/${data.capacity} seats taken).`
  );
});

module.exports = enrollmentEmitter;
