/**
 * @file Enrollment.js
 * @description Mongoose schema and model for a student–course enrollment record.
 *
 * Each document represents one student enrolled in one course.
 * Created and deleted by the RegistrationFacade (Facade pattern);
 * queried directly by the enrollment controller for listing purposes.
 */

const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    /** Reference to the enrolled User document (student). */
    student: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    /** Reference to the Course document the student is enrolled in. */
    course: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Course',
      required: true,
    },

    /** Timestamp recorded at the moment of enrollment. */
    enrolledAt: {
      type:    Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Enrollment', enrollmentSchema);
