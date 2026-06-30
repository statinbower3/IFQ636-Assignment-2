/**
 * @file Course.js
 * @description Mongoose schema and model for a course offering.
 *
 * The `enrolled` counter is managed by the RegistrationFacade (Facade pattern)
 * which increments / decrements it atomically as part of the enrollment workflow.
 * The Proxy pattern (CourseServiceProxy) governs who can create, update, or delete
 * course documents.
 */

const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    /** Course title shown in listings and on the detail page. */
    title:       { type: String, required: true },

    /** Full course description. */
    description: { type: String, required: true },

    /** Name of the instructor delivering the course. */
    instructor:  { type: String, required: true },

    /** Timetable string (e.g. "Monday 10am-12pm"). */
    schedule:    { type: String, required: true },

    /** Maximum number of students that can enrol. */
    capacity:    { type: Number, required: true },

    /**
     * Current number of enrolled students.
     * Managed exclusively by RegistrationFacade — do not update directly.
     */
    enrolled:    { type: Number, default: 0 },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model('Course', courseSchema);
