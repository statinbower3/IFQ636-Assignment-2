/**
 * @file CourseSortStrategy.js
 * @description Implements the **Strategy** design pattern for course list sorting.
 *
 * PATTERN: Strategy
 * PURPOSE: Defines a family of interchangeable sorting algorithms. The calling
 *          code (courseController) selects the desired strategy at runtime via
 *          a query parameter (e.g. ?sortBy=capacity) without needing to know the
 *          sorting algorithm's internals. New sort criteria can be added without
 *          touching existing code (Open/Closed Principle).
 *
 * OOP CONCEPTS USED:
 *  - Class       : Abstract SortStrategy base class + four concrete subclasses.
 *  - Inheritance : All concrete strategies extend SortStrategy.
 *  - Polymorphism: CourseSorter calls `strategy.sort(courses)` — the same method
 *                  name — but each subclass executes a different sorting algorithm
 *                  (method overriding).
 *  - Encapsulation: Sorting logic is hidden inside each strategy class. The
 *                   CourseSorter context only exposes `sort()`.
 *
 * USAGE (in courseController):
 *   const { CourseSorter, getStrategy } = require('../patterns/strategy/CourseSortStrategy');
 *   const sorter = new CourseSorter(getStrategy(req.query.sortBy));
 *   const sorted = sorter.sort(courses);
 */

// ─── Abstract Strategy Base ──────────────────────────────────────────────────

/**
 * Abstract base class that all sort strategies must implement.
 * Calling `sort()` on this base class throws — subclasses must override it.
 */
class SortStrategy {
  /**
   * Sorts the given array of course objects and returns a new sorted array.
   * Subclasses MUST override this method.
   *
   * @abstract
   * @param {Object[]} courses - Array of Mongoose course documents.
   * @returns {Object[]} A new sorted array (original is not mutated).
   * @throws {Error} If not overridden.
   */
  sort(courses) {
    throw new Error('sort() must be implemented by a concrete SortStrategy subclass.');
  }
}

// ─── Concrete Strategies ──────────────────────────────────────────────────────

/**
 * Strategy 1 — Sort alphabetically by course title (A → Z).
 * @extends SortStrategy
 */
class SortByTitle extends SortStrategy {
  /**
   * @override
   * @param {Object[]} courses
   * @returns {Object[]}
   */
  sort(courses) {
    console.log('[Strategy] Sorting courses by title (A→Z).');
    return [...courses].sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    );
  }
}

/**
 * Strategy 2 — Sort by total seat capacity (highest first).
 * @extends SortStrategy
 */
class SortByCapacity extends SortStrategy {
  /**
   * @override
   * @param {Object[]} courses
   * @returns {Object[]}
   */
  sort(courses) {
    console.log('[Strategy] Sorting courses by total capacity (desc).');
    return [...courses].sort((a, b) => b.capacity - a.capacity);
  }
}

/**
 * Strategy 3 — Sort by number of students already enrolled (most popular first).
 * @extends SortStrategy
 */
class SortByEnrolled extends SortStrategy {
  /**
   * @override
   * @param {Object[]} courses
   * @returns {Object[]}
   */
  sort(courses) {
    console.log('[Strategy] Sorting courses by enrolled count (most popular first).');
    return [...courses].sort((a, b) => b.enrolled - a.enrolled);
  }
}

/**
 * Strategy 4 — Sort by available seats (capacity − enrolled), most seats first.
 * Useful for students looking for courses they can still join.
 * @extends SortStrategy
 */
class SortByAvailability extends SortStrategy {
  /**
   * @override
   * @param {Object[]} courses
   * @returns {Object[]}
   */
  sort(courses) {
    console.log('[Strategy] Sorting courses by available seats (most available first).');
    return [...courses].sort(
      (a, b) => (b.capacity - b.enrolled) - (a.capacity - a.enrolled)
    );
  }
}

// ─── Context Class ────────────────────────────────────────────────────────────

/**
 * CourseSorter acts as the *context* in the Strategy pattern.
 * It holds a reference to a strategy and delegates sorting to it,
 * allowing the strategy to be swapped at runtime via `setStrategy()`.
 */
class CourseSorter {
  /**
   * @param {SortStrategy} strategy - The initial sorting strategy to use.
   */
  constructor(strategy) {
    /** @private {SortStrategy} */
    this._strategy = strategy;
  }

  /**
   * Replaces the current strategy at runtime.
   *
   * @param {SortStrategy} strategy - The new sorting strategy.
   */
  setStrategy(strategy) {
    this._strategy = strategy;
  }

  /**
   * Sorts the given courses using the currently active strategy.
   *
   * @param {Object[]} courses - Course documents from MongoDB.
   * @returns {Object[]} Sorted course array.
   */
  sort(courses) {
    return this._strategy.sort(courses);
  }
}

// ─── Strategy Resolver ────────────────────────────────────────────────────────

/**
 * Factory helper — maps a query-string value to the correct strategy instance.
 * Defaults to SortByTitle if an unknown value is provided.
 *
 * @param {string} sortBy - The sort key from the URL query param.
 * @returns {SortStrategy}
 */
const getStrategy = (sortBy) => {
  switch (sortBy) {
    case 'capacity':     return new SortByCapacity();
    case 'enrolled':     return new SortByEnrolled();
    case 'availability': return new SortByAvailability();
    case 'title':
    default:             return new SortByTitle();
  }
};

module.exports = {
  SortStrategy,
  SortByTitle,
  SortByCapacity,
  SortByEnrolled,
  SortByAvailability,
  CourseSorter,
  getStrategy,
};
