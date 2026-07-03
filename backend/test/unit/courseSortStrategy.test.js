/**
 * @file courseSortStrategy.test.js
 * @description UNIT tests for the Strategy pattern (CourseSortStrategy).
 *
 * Each sorting strategy is a pure function of its input array, so these tests
 * need no database. They verify each concrete strategy sorts correctly, that the
 * original array is never mutated, that the CourseSorter context delegates to and
 * can swap strategies, and that getStrategy() maps query values to the right class.
 */

const { expect } = require('chai');

const {
  SortStrategy,
  SortByTitle,
  SortByCapacity,
  SortByEnrolled,
  SortByAvailability,
  CourseSorter,
  getStrategy,
} = require('../../patterns/strategy/CourseSortStrategy');

// Sample course data reused across tests.
const courses = () => ([
  { title: 'Zoology',    capacity: 10, enrolled: 9 },  // avail 1
  { title: 'algorithms', capacity: 50, enrolled: 10 }, // avail 40
  { title: 'Biology',    capacity: 30, enrolled: 30 }, // avail 0
]);

describe('UNIT: SortStrategy (abstract base)', () => {
  it('throws if sort() is called on the un-overridden base class', () => {
    expect(() => new SortStrategy().sort([])).to.throw(/must be implemented/);
  });
});

describe('UNIT: Concrete sort strategies', () => {

  it('SortByTitle sorts alphabetically, case-insensitively (A→Z)', () => {
    const sorted = new SortByTitle().sort(courses());
    expect(sorted.map(c => c.title)).to.deep.equal(['algorithms', 'Biology', 'Zoology']);
  });

  it('SortByCapacity sorts by capacity descending', () => {
    const sorted = new SortByCapacity().sort(courses());
    expect(sorted.map(c => c.capacity)).to.deep.equal([50, 30, 10]);
  });

  it('SortByEnrolled sorts by enrolled count descending', () => {
    const sorted = new SortByEnrolled().sort(courses());
    expect(sorted.map(c => c.enrolled)).to.deep.equal([30, 10, 9]);
  });

  it('SortByAvailability sorts by free seats (capacity - enrolled) descending', () => {
    const sorted = new SortByAvailability().sort(courses());
    expect(sorted.map(c => c.title)).to.deep.equal(['algorithms', 'Zoology', 'Biology']);
  });

  it('does not mutate the original array (returns a new sorted copy)', () => {
    const original = courses();
    const snapshot = original.map(c => c.title);
    new SortByCapacity().sort(original);
    expect(original.map(c => c.title)).to.deep.equal(snapshot);
  });
});

describe('UNIT: CourseSorter (context)', () => {

  it('delegates sorting to the strategy passed in the constructor', () => {
    const sorter = new CourseSorter(new SortByCapacity());
    expect(sorter.sort(courses()).map(c => c.capacity)).to.deep.equal([50, 30, 10]);
  });

  it('setStrategy() swaps the algorithm at runtime', () => {
    const sorter = new CourseSorter(new SortByCapacity());
    sorter.setStrategy(new SortByTitle());
    expect(sorter.sort(courses()).map(c => c.title)).to.deep.equal(['algorithms', 'Biology', 'Zoology']);
  });
});

describe('UNIT: getStrategy() resolver', () => {

  it('maps "capacity" to SortByCapacity', () => {
    expect(getStrategy('capacity')).to.be.an.instanceOf(SortByCapacity);
  });

  it('maps "enrolled" to SortByEnrolled', () => {
    expect(getStrategy('enrolled')).to.be.an.instanceOf(SortByEnrolled);
  });

  it('maps "availability" to SortByAvailability', () => {
    expect(getStrategy('availability')).to.be.an.instanceOf(SortByAvailability);
  });

  it('maps "title" to SortByTitle', () => {
    expect(getStrategy('title')).to.be.an.instanceOf(SortByTitle);
  });

  it('defaults to SortByTitle for an unknown value', () => {
    expect(getStrategy('nonsense')).to.be.an.instanceOf(SortByTitle);
  });
});
