# Unit Test Suite

These are **true unit tests**: each one exercises a single class/module in
isolation, with **no database and no HTTP server**. Any collaborator that would
touch MongoDB (the Course/Enrollment models, the real CourseService) is replaced
with a **Sinon stub**, so the tests are fast, deterministic, and runnable
offline.

This is distinct from `test/sample.test.js`, which is an **integration/API test
suite** that fires real HTTP requests through the Express app against a live
MongoDB Atlas connection.

## Running

```bash
# unit tests only — no MONGO_URI or network needed
npm run test:unit

# original integration suite (needs MONGO_URI / live DB)
npm test
```

`npm run test:unit` uses `.mocharc.unit.yml`, which limits the run to
`test/unit/**/*.test.js` and loads `test/unit/_setup.js` (which silences the
classes' diagnostic `console.log` output for readable results).

## What is covered

| File                              | Unit under test            | Pattern / concept              |
|-----------------------------------|----------------------------|--------------------------------|
| `oop.test.js`                     | BaseUser / AdminUser / StudentUser | Encapsulation, inheritance, polymorphism, abstraction |
| `userFactory.test.js`             | UserFactory                | Factory                        |
| `courseSortStrategy.test.js`      | CourseSort strategies + CourseSorter | Strategy               |
| `enrollmentEventEmitter.test.js`  | EnrollmentEventEmitter     | Observer                       |
| `requestChain.test.js`            | Logging/Sanitization/Validation handlers | Chain of Responsibility |
| `registrationFacade.test.js`      | RegistrationFacade         | Facade (models stubbed)        |
| `courseServiceProxy.test.js`      | CourseServiceProxy         | Proxy (real service stubbed)   |

72 test cases in total.

## Dependencies

Uses the packages already declared in `backend/package.json`:
`mocha`, `chai`, and `sinon`. Run `npm install` in `backend/` first.
