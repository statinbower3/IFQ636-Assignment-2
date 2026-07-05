# Online Course Registration System — IFQ636

A full-stack course registration platform built on the MERN stack (MongoDB, Express.js, React.js, Node.js). Students can browse courses, enrol within capacity limits, and manage their profile. Administrators have a protected panel to create, update, and delete courses, and view all enrolments across the platform.

**Live URL:** http://3.107.114.224/  
**Backend API:** http://3.107.114.224:5001  
**GitHub Repository:** https://github.com/statinbower3/IFQ636-Assignment-2

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Design Patterns & OOP](#design-patterns--oop)
- [Getting Started (Local)](#getting-started-local)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [Production Deployment](#production-deployment)
- [Reflection](#reflection)
- [References](#references)

---

## Features

### Student
- Register and log in securely (JWT authentication via jsonwebtoken (npm, 2024b) with bcrypt password hashing (npm, 2024a))
- Browse all available courses with real-time capacity indicators
- Enrol in courses (capacity enforced — full courses are blocked with HTTP 400)
- Drop enrolled courses (enrolled counter decrements automatically)
- View and update profile (name, email, university, address)

### Admin
- All student capabilities
- Create, update, and delete courses via a protected admin panel
- Cascading delete — removing a course also removes all associated enrolments
- View all student enrolments across every course with student and course details

---

## Tech Stack

The stack pairs a React (React, 2024) and Tailwind CSS (Tailwind Labs, 2024) client with an Express.js (Express.js, 2024) API layered over MongoDB Atlas (MongoDB, 2024) through Mongoose (Mongoose, 2024); the browser talks to the API via Axios (Axios, 2024).

| Layer | Technology | Version |
|---|---|---|
| Frontend | React.js | 18.2 |
| Routing | React Router DOM | 6.10 |
| HTTP Client | Axios | 1.3.4 |
| Styling | Tailwind CSS | 3.4 |
| Backend | Node.js + Express.js | Express 4.17 |
| Database | MongoDB Atlas | Mongoose 6 |
| Authentication | JWT + bcrypt | jsonwebtoken 9 |
| Testing | Mocha + Chai + chai-http + Sinon | Mocha 11 |
| Process Manager | PM2 | Latest |
| Web Server | Nginx | Latest |
| CI/CD | GitHub Actions (self-hosted runner) | — |
| Cloud | AWS EC2 (Ubuntu 22.04) | — |

---

## Project Structure

```
assignment-1-IFQ636/
├── .github/
│   └── workflows/
│       └── deploy.yml              # 3-job CI/CD pipeline (test → build → deploy)
├── backend/
│   ├── config/
│   │   └── db.js                   # MongoDB Atlas connection via Mongoose
│   ├── controllers/
│   │   ├── authController.js       # register, login, getProfile, updateProfile
│   │   ├── courseController.js     # CRUD operations + cascade delete enrollments
│   │   └── enrollmentController.js # enrol, drop, list (student + admin views)
│   ├── middleware/
│   │   └── authMiddleware.js       # protect (JWT verify) + adminOnly (role check)
│   ├── models/
│   │   ├── User.js                 # name, email, password (bcrypt hashed), role
│   │   ├── Course.js               # title, description, instructor, schedule, capacity, enrolled
│   │   └── Enrollment.js           # student ref, course ref, enrolledAt timestamp
│   ├── oop/                        # Domain objects demonstrating core OOP principles
│   │   ├── BaseUser.js             # Abstract base class — encapsulation + shared behaviour
│   │   ├── AdminUser.js            # extends BaseUser — inheritance + method overriding
│   │   └── StudentUser.js          # extends BaseUser — inheritance + overloading simulation
│   ├── patterns/                   # Seven GoF design patterns (see Design Patterns & OOP)
│   │   ├── singleton/
│   │   │   └── DatabaseConnection.js   # Singleton — one shared MongoDB connection
│   │   ├── factory/
│   │   │   └── UserFactory.js          # Factory — builds AdminUser/StudentUser by role
│   │   ├── strategy/
│   │   │   └── CourseSortStrategy.js   # Strategy — interchangeable course sort algorithms
│   │   ├── observer/
│   │   │   └── EnrollmentEventEmitter.js # Observer — broadcasts enrolment/drop/full events
│   │   ├── facade/
│   │   │   └── RegistrationFacade.js   # Facade — simplifies the enrol/drop workflow
│   │   ├── chain/
│   │   │   └── RequestChain.js         # Chain of Responsibility — logging → sanitisation → validation
│   │   └── proxy/
│   │       └── CourseServiceProxy.js   # Proxy — access control + audit logging on CourseService
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth endpoints
│   │   ├── courseRoutes.js         # /api/courses (write routes protected by JWT)
│   │   └── enrollmentRoutes.js     # /api/enrollments (all protected by JWT)
│   ├── test/
│   │   ├── sample.test.js          # 32 integration tests (real HTTP + live MongoDB)
│   │   └── unit/                   # 72 isolated unit tests (no DB — Sinon stubs)
│   │       ├── oop.test.js                    # BaseUser / AdminUser / StudentUser
│   │       ├── userFactory.test.js            # Factory pattern
│   │       ├── courseSortStrategy.test.js     # Strategy pattern
│   │       ├── enrollmentEventEmitter.test.js # Observer pattern
│   │       ├── requestChain.test.js           # Chain of Responsibility pattern
│   │       ├── registrationFacade.test.js     # Facade pattern (models stubbed)
│   │       ├── courseServiceProxy.test.js     # Proxy pattern (service stubbed)
│   │       ├── intentionalFailure.test.js     # 3 designed-to-fail tests (demo)
│   │       ├── _setup.js                       # silences class console output
│   │       └── README.md                       # how to run the unit suite
│   ├── .mocharc.yml                # Mocha config for the integration suite
│   ├── .mocharc.unit.yml           # Mocha config for the gated unit suite
│   ├── .mocharc.unit-demo.yml      # Mocha config for the intentional-failure demo
│   ├── server.js                   # Express app; exports for testing, listens when run directly
│   └── package.json
├── frontend/
│   └── src/
│       ├── components/             # Navbar, TaskForm, TaskList
│       ├── context/
│       │   └── AuthContext.js      # Global user state — login/logout/token
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── CourseList.jsx      # Public course browser with Enrol button
│       │   ├── MyCourses.jsx       # Student's enrolled courses with Drop button
│       │   ├── Profile.jsx         # View and update user profile
│       │   └── AdminPanel.jsx      # Course CRUD form + enrolments table
│       ├── axiosConfig.jsx         # Axios instance — baseURL set to EC2 public IP
│       └── App.js                  # Route definitions + admin route guard
└── package.json                    # Root scripts: install-all, start, dev
```

---

## Design Patterns & OOP

The backend demonstrates seven Gang-of-Four design patterns (Gamma et al., 1994; Refactoring Guru, 2024) and a four-class OOP inheritance hierarchy, both layered on top of the existing Express/Mongoose architecture without changing any API contracts. Every pattern file under `backend/patterns/` carries a JSDoc header explaining its purpose, the OOP concepts it relies on, and how it is wired into the controllers.

### Summary table

| # | Pattern | Location | Role in this app | Why this pattern |
|---|---|---|---|---|
| 1 | **Singleton** | `patterns/singleton/DatabaseConnection.js` | Guarantees a single shared MongoDB connection across the app lifecycle | Opening a new Mongoose connection per request would exhaust the Atlas connection pool; a singleton ensures `getInstance()` always returns the same connection object |
| 2 | **Factory** | `patterns/factory/UserFactory.js` | `UserFactory.createUser()` builds an `AdminUser` or `StudentUser` from a `role` string | Decouples callers from concrete classes — controllers ask for "a user with this role" instead of branching on `if (role === 'admin')` everywhere |
| 3 | **Strategy** | `patterns/strategy/CourseSortStrategy.js` | Four interchangeable sort algorithms (title, capacity, enrolled, availability) selected via `?sortBy=` | New sort criteria can be added as a new class without touching `CourseSorter` or the controller (Open/Closed Principle) |
| 4 | **Observer** | `patterns/observer/EnrollmentEventEmitter.js` | Broadcasts `enrollment:created`, `enrollment:dropped`, `course:full` events to independent subscribers (audit log, simulated email notifier, capacity alert), built on Node's `EventEmitter` (Node.js, 2024) | Keeps the enrolment logic free of side-effect code — notification/logging concerns can be added or removed without editing the facade |
| 5 | **Facade** | `patterns/facade/RegistrationFacade.js` | Single `enrollStudent()` / `dropStudent()` entry point that internally orchestrates course lookup, capacity check, duplicate check, enrolment write, counter update, and Observer event | Hides a 5–6 step workflow spanning two models and the Observer behind one call, so `enrollmentController.js` stays thin |
| 6 | **Chain of Responsibility** | `patterns/chain/RequestChain.js` | `LoggingHandler → SanitizationHandler → (Express)` request pipeline, with a `ValidationHandler` available to short-circuit on missing fields | Each concern (logging, sanitisation, validation) is an independent, swappable link; adding a new pre-processing step needs no change to existing handlers |
| 7 | **Proxy** | `patterns/proxy/CourseServiceProxy.js` | Wraps the real `CourseService` to enforce admin-only mutations and write an audit log before delegating | Controllers only ever talk to the proxy, so access control and auditing cannot be bypassed by calling the real service directly |

### OOP principles

| Principle | Where it's demonstrated |
|---|---|
| **Encapsulation** | `BaseUser.js` uses a true private field (`#role`) (MDN Web Docs, 2024) so role cannot be reassigned from outside the class; `DatabaseConnection._connection` and `RegistrationFacade`'s `_findCourse`/`_checkCapacity` helpers are private-by-convention |
| **Inheritance** | `AdminUser extends BaseUser` and `StudentUser extends BaseUser` (`backend/oop/`); `LoggingHandler`, `SanitizationHandler`, and `ValidationHandler` all extend `RequestHandler` |
| **Polymorphism** | `getPermissions()` and `describe()` are overridden differently by `AdminUser` and `StudentUser`; all four `SortStrategy` subclasses share the `sort()` method signature but execute different algorithms; `StudentUser.trackEnrollment()` simulates method overloading by branching on argument type, since JavaScript has no native overloading |
| **Abstraction** | `BaseUser.getPermissions()` and `SortStrategy.sort()` throw if not overridden, defining a contract concrete subclasses must fulfil |

### How the patterns connect

```
Request → RequestChain (Logging → Sanitisation)
            → Controller
                → CourseServiceProxy (admin check + audit) → CourseService → Course model
                → RegistrationFacade (enrol/drop) → Course + Enrollment models
                                                   → EnrollmentEventEmitter (Observer)
                → UserFactory → AdminUser / StudentUser (OOP hierarchy)
                → CourseSorter + getStrategy() (Strategy)
            → DatabaseConnection (Singleton, used once at startup)
```

---

## Getting Started (Local)

### Prerequisites

- Node.js v22+
- npm v8+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/assignment-1-IFQ636.git
cd assignment-1-IFQ636
```

### 2. Install all dependencies at once

```bash
npm run install-all
```

This runs `npm install` in the root, `backend/`, and `frontend/` directories simultaneously.

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — see Environment Variables section below
```

### 4. Update the frontend API base URL for local development

In `frontend/src/axiosConfig.jsx`, switch the baseURL:

```js
// For local development:
baseURL: 'http://localhost:5001',

// For production (already set in repo):
// baseURL: 'http://3.106.127.224:5001',
```

### 5. Run in development mode

```bash
npm run dev
```

Uses `concurrently` to start both the backend (nodemon, auto-reload) and the frontend dev server simultaneously.

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5001 |

### 6. Run tests

```bash
# Unit tests — isolated, no database required
npm run test:unit --prefix backend

# Integration tests — needs a live MONGO_URI in backend/.env
npm test --prefix backend
```

---

## Environment Variables

Create `backend/.env` with the following:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your_jwt_secret_here
PORT=5001
```

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens |
| `PORT` | Port for the Express server (default: 5001) |

> **In production**, these values are stored as GitHub Actions Secrets and written to the `.env` file on the server automatically during deployment. They are never committed to the repository. MongoDB Atlas Network Access must include `0.0.0.0/0` to allow connections from GitHub Actions' dynamic IP addresses.

---

## API Endpoints

All protected endpoints require an `Authorization: Bearer <token>` header.

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Create a new user account (role: student) |
| POST | `/api/auth/login` | None | Log in and receive a 30-day JWT |
| GET | `/api/auth/profile` | JWT | Get the current user's profile |
| PUT | `/api/auth/profile` | JWT | Update name, email, university, address |

### Courses — `/api/courses`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/courses` | None | Get all courses (public) |
| GET | `/api/courses/:id` | None | Get a single course by ID |
| POST | `/api/courses` | JWT | Create a new course |
| PUT | `/api/courses/:id` | JWT | Update a course |
| DELETE | `/api/courses/:id` | JWT | Delete a course (cascades to enrolments) |

### Enrollments — `/api/enrollments`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/enrollments/:courseId` | JWT | Enrol in a course (capacity enforced) |
| GET | `/api/enrollments/my` | JWT | Get current student's enrolments |
| DELETE | `/api/enrollments/:courseId` | JWT | Drop a course |
| GET | `/api/enrollments/all` | JWT | Get all enrolments (admin view) |

---

## Testing

The backend has **two complementary test suites**, plus a small intentional-failure demo, run separately:

| Suite | Location | Command | Count | Needs MongoDB? | What it tests |
|---|---|---|---|---|---|
| **Unit** | `backend/test/unit/` | `npm run test:unit` | 72 | No | Each OOP / design-pattern class in isolation. DB collaborators (Course, Enrollment, CourseService) are replaced with **Sinon stubs** (Sinon.JS, 2024), so the tests are fast, deterministic, and run offline. |
| **Unit failure demo** | `backend/test/unit/intentionalFailure.test.js` | `npm run test:unit:demo` | 3 | No | Three tests **designed to fail** — the unit-suite counterpart to the integration suite's TC-32. They prove the unit tests catch incorrect behaviour rather than passing trivially. Excluded from the gated `npm run test:unit` run so it stays 100% green. |
| **Integration** | `backend/test/sample.test.js` | `npm test` | 32 | Yes | Real HTTP requests fired with chai-http (Chai, 2024) through the full Express stack (routes → middleware → controllers → models) against a live MongoDB Atlas connection. Both suites run on Mocha (Mocha, 2024). |

Unit-test `describe` blocks are all prefixed with `UNIT:` so they are easy to identify in the reporter output.

### Unit test cases (72 tests)

Pure, isolated tests — no network, no database. Every one passes.

| ID | Suite | Description | Verifies |
|---|---|---|---|
| UT-01 | BaseUser | assigns constructor fields correctly | Construction |
| UT-02 | BaseUser | defaults university to null when not supplied | Construction |
| UT-03 | BaseUser | exposes role only through a read-only getter | Encapsulation (`#role`) |
| UT-04 | BaseUser | throws when getPermissions() is called on the abstract base | Abstraction |
| UT-05 | BaseUser | describe() returns a readable base description | Behaviour |
| UT-06 | BaseUser | toJSON() omits any password field and includes role | Safe serialisation |
| UT-07 | AdminUser | is an instance of BaseUser | Inheritance |
| UT-08 | AdminUser | forces the role to "admin" regardless of input | Encapsulation |
| UT-09 | AdminUser | overrides getPermissions() with the full admin set | Polymorphism |
| UT-10 | AdminUser | inherits hasPermission() and evaluates against admin perms | Inheritance |
| UT-11 | AdminUser | overrides describe() with an admin-specific string | Polymorphism |
| UT-12 | AdminUser | isSuperAdmin() reflects the admin level (default false) | Behaviour |
| UT-13 | StudentUser | is an instance of BaseUser | Inheritance |
| UT-14 | StudentUser | forces the role to "student" | Encapsulation |
| UT-15 | StudentUser | overrides getPermissions() with the restricted set | Polymorphism |
| UT-16 | StudentUser | starts with zero tracked enrollments | State |
| UT-17 | StudentUser | trackEnrollment() accepts a single course id | Overloading (overload 1) |
| UT-18 | StudentUser | trackEnrollment() accepts an array of course ids | Overloading (overload 2) |
| UT-19 | StudentUser | trackEnrollment() throws a TypeError on bad input | Input validation |
| UT-20 | StudentUser | getEnrolledCourseIds() returns a copy, not the internal array | Encapsulation |
| UT-21 | StudentUser | describe() reflects the current enrollment count | Behaviour |
| UT-22 | UserFactory | creates an AdminUser when role is "admin" | Factory |
| UT-23 | UserFactory | creates a StudentUser when role is "student" | Factory |
| UT-24 | UserFactory | falls back to StudentUser for an unknown role | Safe default |
| UT-25 | UserFactory | falls back to StudentUser when role is missing | Safe default |
| UT-26 | UserFactory | produced objects honour the shared BaseUser interface | Polymorphism |
| UT-27 | SortStrategy | throws if sort() is called on the un-overridden base | Abstraction |
| UT-28 | Strategy | SortByTitle sorts alphabetically, case-insensitively | Strategy |
| UT-29 | Strategy | SortByCapacity sorts by capacity descending | Strategy |
| UT-30 | Strategy | SortByEnrolled sorts by enrolled count descending | Strategy |
| UT-31 | Strategy | SortByAvailability sorts by free seats descending | Strategy |
| UT-32 | Strategy | does not mutate the original array | Immutability |
| UT-33 | CourseSorter | delegates sorting to the strategy from the constructor | Strategy context |
| UT-34 | CourseSorter | setStrategy() swaps the algorithm at runtime | Strategy context |
| UT-35 | getStrategy | maps "capacity" to SortByCapacity | Resolver |
| UT-36 | getStrategy | maps "enrolled" to SortByEnrolled | Resolver |
| UT-37 | getStrategy | maps "availability" to SortByAvailability | Resolver |
| UT-38 | getStrategy | maps "title" to SortByTitle | Resolver |
| UT-39 | getStrategy | defaults to SortByTitle for an unknown value | Resolver default |
| UT-40 | Observer | notifyEnrollment() delivers the payload to a subscriber | Observer |
| UT-41 | Observer | notifyDropped() delivers the payload to a subscriber | Observer |
| UT-42 | Observer | notifyCourseFull() delivers the payload to a subscriber | Observer |
| UT-43 | Observer | supports multiple observers for the same event | One-to-many broadcast |
| UT-44 | Observer | unsubscribe() stops further events reaching an observer | Observer |
| UT-45 | LoggingHandler | always passes the request to next() when last | Chain |
| UT-46 | SanitizationHandler | trims whitespace from string body fields | Chain |
| UT-47 | SanitizationHandler | leaves non-string body fields untouched | Chain |
| UT-48 | ValidationHandler | short-circuits with 400 when a required field is missing | Chain short-circuit |
| UT-49 | ValidationHandler | passes through when all required fields are present | Chain |
| UT-50 | ValidationHandler | skips validation for GET requests | Chain |
| UT-51 | buildChain | throws when given an empty handler list | Guard |
| UT-52 | buildChain | links handlers so the request flows through every link | Chain wiring |
| UT-53 | buildChain | short-circuits the whole chain when validation fails | Chain short-circuit |
| UT-54 | Facade.enroll | runs the full happy-path workflow and returns the enrollment | Facade orchestration |
| UT-55 | Facade.enroll | throws 404 when the course does not exist | Error branch |
| UT-56 | Facade.enroll | throws 400 "Course is full" and creates nothing | Capacity branch |
| UT-57 | Facade.enroll | throws 400 when the student is already enrolled | Duplicate branch |
| UT-58 | Facade.drop | deletes, decrements the counter, fires the drop event | Facade orchestration |
| UT-59 | Facade.drop | throws 404 when the enrollment is not found | Error branch |
| UT-60 | Facade.drop | never lets the enrolled counter go below zero | Boundary |
| UT-61 | Proxy.create | delegates to the real service for an admin | Proxy delegation |
| UT-62 | Proxy.create | throws 403 for a student and never touches the service | Access control |
| UT-63 | Proxy.create | throws 403 when no user is supplied (guest) | Access control |
| UT-64 | Proxy.findAll | returns all courses without requiring a user | Public read |
| UT-65 | Proxy.findById | returns the course when it exists | Public read |
| UT-66 | Proxy.findById | throws 404 when the course does not exist | Error branch |
| UT-67 | Proxy.update | delegates to the real service for an admin | Proxy delegation |
| UT-68 | Proxy.update | throws 403 for a non-admin | Access control |
| UT-69 | Proxy.update | throws 404 when the course to update is not found | Error branch |
| UT-70 | Proxy.delete | delegates to the real service for an admin | Proxy delegation |
| UT-71 | Proxy.delete | throws 403 for a non-admin | Access control |
| UT-72 | Proxy.delete | throws 404 when the course to delete is not found | Error branch |

### Unit intentional-failure scenarios (3 tests — designed to fail)

Mirroring integration TC-32, these live in `backend/test/unit/intentionalFailure.test.js` and each asserts something deliberately **wrong** about otherwise-correct code, proving the unit suite catches regressions rather than passing trivially. They are **excluded** from `npm run test:unit` (via the `ignore` key in `.mocharc.unit.yml`) so the gated suite stays green; run them on demand with `npm run test:unit:demo`.

| Test Case ID | Description | Expected Output | Actual Output |
|---|---|---|---|
| UT-F1 | Factory asserted to return a `StudentUser` for role `"admin"` (it correctly returns an `AdminUser`) | Test passes only if the Factory is broken | `AssertionError: expected AdminUser to be an instance of StudentUser` → **Fail (by design)** |
| UT-F2 | `SortByCapacity` asserted to sort **ascending** `[10, 30, 50]` (it correctly sorts descending) | Test passes only if the comparator is flipped | `AssertionError: expected [50, 30, 10] to deeply equal [10, 30, 50]` → **Fail (by design)** |
| UT-F3 | `StudentUser` asserted to hold the `delete_course` permission (students correctly cannot delete) | Test passes only if privilege escalation is introduced | `AssertionError: expected [Array(4)] to include 'delete_course'` → **Fail (by design)** |

### Integration test cases (32 tests)

Test 32 is an **intentional failure** kept in the suite on purpose, to demonstrate that the suite actually catches incorrect behaviour rather than passing trivially.

| Test Case ID | Description | Expected Output | Actual Output |
|---|---|---|---|
| TC-01 | Register a new student | 201, `token` present, email matches, no `password` field returned | 201, token present, email matches, no password field — **Pass** |
| TC-02 | Register with a duplicate email | 400, message "User already exists" | 400, "User already exists" — **Pass** |
| TC-03 | Register the admin user | 201, `token` present | 201, token present — **Pass** |
| TC-04 | Log in with valid student credentials | 200, `token` present, email matches | 200, token present, email matches — **Pass** |
| TC-05 | Log in with an incorrect password | 401, message "Invalid email or password" | 401, "Invalid email or password" — **Pass** |
| TC-06 | Log in with a non-existent email | 401 | 401 — **Pass** |
| TC-07 | Get authenticated user profile | 200, name/email match, no `password` field | 200, fields match, no password — **Pass** |
| TC-08 | Get profile with no token | 401 | 401 — **Pass** |
| TC-09 | Get profile with an invalid token | 401 | 401 — **Pass** |
| TC-10 | Update profile (university, address) | 200, fields reflect new values | 200, fields updated — **Pass** |
| TC-11 | Update profile with no token | 401 | 401 — **Pass** |
| TC-12 | List all courses (public) | 200, response is an array | 200, array returned — **Pass** |
| TC-13 | Create a course (admin token) | 201, title/capacity match, `enrolled` starts at 0 | 201, fields match, enrolled = 0 — **Pass** |
| TC-14 | Create a course with no token | 401 | 401 — **Pass** |
| TC-15 | Get a single course by ID | 200, `_id` and title match | 200, fields match — **Pass** |
| TC-16 | Get a course with an invalid ID format | 400, 404, or 500 (any one of) | 500 — **Pass** |
| TC-17 | Update a course (admin token) | 200, `capacity` reflects new value | 200, capacity = 50 — **Pass** |
| TC-18 | Update a course with no token | 401 | 401 — **Pass** |
| TC-19 | Student enrols in a course | 201, response has `student` and `course` fields | 201, fields present — **Pass** |
| TC-20 | Student enrols in the same course again (duplicate) | 400, message "Already enrolled in this course" | 400, "Already enrolled in this course" — **Pass** |
| TC-21 | Enrol with no token | 401 | 401 — **Pass** |
| TC-22 | Get the logged-in student's enrolled courses | 200, array with ≥1 item, each item has `course` | 200, array returned with course field — **Pass** |
| TC-23 | Get "my enrolments" with no token | 401 | 401 — **Pass** |
| TC-24 | Admin views all enrolments | 200, response is an array | 200, array returned — **Pass** |
| TC-25 | View all enrolments with no token | 401 | 401 — **Pass** |
| TC-26 | Student drops an enrolled course | 200, message "Course dropped successfully" | 200, "Course dropped successfully" — **Pass** |
| TC-27 | Drop a course not currently enrolled in | 404, message "Enrollment not found" | 404, "Enrollment not found" — **Pass** |
| TC-28 | Drop with no token | 401 | 401 — **Pass** |
| TC-29 | Enrol in a course at full capacity (capacity = 1, pre-filled) | 400, message "Course is full" | 400, "Course is full" — **Pass** |
| TC-30 | Admin deletes a course | 200, message "Course deleted successfully" | 200, "Course deleted successfully" — **Pass** |
| TC-31 | Delete a course with no token | 401 | 401 — **Pass** |
| TC-32 | *Intentional failure demo* — login with bad credentials asserted against 200 | 200 (deliberately wrong assertion; API correctly returns 401) | 401 returned by API → assertion fails — **Fail (by design)** |

### Running tests locally

```bash
cd backend
npm install

npm run test:unit        # 72 unit tests — no database needed (all pass)
npm run test:unit:demo   # 3 intentional-failure tests — no database needed (all fail by design)
npm test                 # 32 integration tests — needs MONGO_URI in .env
```

### Test configuration

Three Mocha config files keep the runs cleanly separated:

**`backend/.mocharc.yml`** — integration suite (used by `npm test`):

```yaml
spec: 'test/*.test.js'   # top-level integration file only (excludes test/unit/)
timeout: 15000
exit: true
```

**`backend/.mocharc.unit.yml`** — gated unit suite (used by `npm run test:unit`):

```yaml
spec: 'test/unit/**/*.test.js'
ignore: 'test/unit/intentionalFailure.test.js'   # keep the gated suite green
require: './test/unit/_setup.js'
timeout: 5000
exit: true
```

**`backend/.mocharc.unit-demo.yml`** — intentional-failure demo (used by `npm run test:unit:demo`):

```yaml
spec: 'test/unit/intentionalFailure.test.js'
require: './test/unit/_setup.js'
timeout: 5000
exit: true
```

The integration `spec` is scoped to `test/*.test.js` (non-recursive) so the unit
tests under `test/unit/` are not swept into the DB-dependent run. The gated unit
config `ignore`s the intentional-failure file so `npm run test:unit` stays 100%
green as a CI gate, while `npm run test:unit:demo` runs only those deliberate
failures. All unit configs load `_setup.js`, which silences the classes'
diagnostic `console.log` output so the reporter stays readable.

---

## CI/CD Pipeline

The deployment pipeline is defined in `.github/workflows/deploy.yml` and runs automatically on every push to the `main` branch using GitHub Actions (GitHub Docs, 2024). Three sequential jobs enforce a test-before-deploy discipline:

```
push to main
     │
     ▼
┌─────────────┐
│  Job 1      │  test
│  Run tests  │  runs-on: ubuntu-latest
│  (backend)  │  → npm install --prefix backend
│             │  → npm run test:unit --prefix backend   (72 unit tests, no DB)
│             │  → npm run test:unit:demo --prefix backend (3 intentional fails, continue-on-error)
└──────┬──────┘  → npm test --prefix backend            (32 integration tests)
       │         (integration step uses MONGO_URI + JWT_SECRET from GitHub Secrets)
       ▼
┌──────────────────┐
│  Job 2           │  build-frontend
│  Build React app │  runs-on: ubuntu-latest
│                  │  → npm install --prefix frontend
└──────┬───────────┘  → CI=false npm run build --prefix frontend
       │               → uploads build/ as GitHub Actions artifact
       ▼
┌─────────────────────────────────────┐
│  Job 3                              │  deploy
│  Deploy to EC2                      │  runs-on: self-hosted  ← EC2 runner
│                                     │
│  1. Download frontend build artifact│
│  2. rsync backend → /home/ubuntu/app/backend/
│  3. rsync frontend/build/ → /home/ubuntu/app/frontend/build/
│  4. Write .env from GitHub Secrets  │
│  5. npm install --omit=dev          │
│  6. pm2 restart mern-backend        │
│  7. pm2 save                        │
│  8. sudo systemctl reload nginx     │
└─────────────────────────────────────┘
```

### GitHub Secrets required

| Secret | Used in |
|---|---|
| `MONGO_URI` | Job 1 (tests) + Job 3 (writes .env on EC2) |
| `JWT_SECRET` | Job 1 (tests) + Job 3 (writes .env on EC2) |
| `EC2_HOST` | git runner |
| `EC2_SSH_KEY` | git runner |
| `EC2_USER` | git runners |

### Self-hosted runner setup

The deploy job runs directly on the EC2 instance using a GitHub Actions self-hosted runner. This eliminates the need for SSH keys or external deployment tools.

```bash
# On the EC2 instance:
# 1. Go to GitHub repo → Settings → Actions → Runners → New self-hosted runner
# 2. Select Linux and run the installation commands shown
# 3. Start as a persistent service:
sudo ./svc.sh install
sudo ./svc.sh start
```

---

## Production Deployment

The application runs on AWS EC2 (Amazon Web Services, 2024) (Ubuntu 22.04), with the backend kept alive by PM2 (PM2, 2024) and static assets served by Nginx (Nginx, 2024). The infrastructure breaks down as follows:

| Component | Tool | Details |
|---|---|---|
| Backend process | PM2 | Process name: `mern-backend`, auto-restarts on crash |
| Static file serving | Nginx | Serves `frontend/build/` and proxies `/api` to port 5001 |
| Database | MongoDB Atlas | Cloud-hosted, connection via `MONGO_URI` env var |

### Nginx configuration

```nginx
server {
    listen 80;

    root /home/ubuntu/app/frontend/build;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Useful PM2 commands

```bash
pm2 list                    # Show all running processes
pm2 logs mern-backend       # Stream backend logs
pm2 restart mern-backend    # Restart the backend
pm2 stop mern-backend       # Stop the backend
pm2 startup                 # Configure auto-start on server reboot
pm2 save                    # Save current process list
```

---

## Reflection

### What went well

The MERN stack proved to be a productive choice for this project. The shared use of JavaScript across the frontend and backend eliminated context-switching between languages and made it straightforward to reuse data structures such as the course and enrollment schemas on both sides of the application. React's component model and Context API made global authentication state simple to manage — once `AuthContext` was in place, adding token-gated behaviour to any new page required only a single `useAuth()` call.

The CI/CD pipeline was the most rewarding component to build. The decision to use a self-hosted GitHub Actions runner on the EC2 instance — rather than SSH-based deployment — turned out to be significantly simpler to maintain as it was easier to run the CI/CD pipeline once the ec2 instace was made the runner and deployment system. There are no key pairs to rotate, no deployment secrets beyond the two already needed for the application, and the runner executes commands with direct filesystem access exactly as a developer would on the server. Watching a `git push` automatically test, build, and deploy the full application in under two minutes made the operational value of continuous deployment tangible in a way that reading about it does not.

Planning the project through JIRA sprints (Atlassian, 2024) also added genuine structure. Writing user stories before opening the code editor forced a clear articulation of what each feature needed to achieve from the user's perspective, which kept the implementation focused. The sprint backlog made it easy to identify when scope creep was occurring and defer non-essential features to a later sprint.

Retrofitting seven design patterns onto a working application — rather than designing them in from a blank file — turned out to be a useful constraint. It forced each pattern to justify its own existence: the Facade only earned its place because `enrollmentController.js` was genuinely coordinating five separate steps across two models and an event emitter, and the Proxy only made sense because admin-only mutation checks and audit logging were two cross-cutting concerns that kept getting duplicated across `courseController.js`. Patterns that didn't map onto an existing pain point (an early attempt at a Decorator around course pricing, for example) were dropped rather than forced in for the sake of the requirement.

### Challenges and how they were resolved

The most significant technical challenge was configuring MongoDB Atlas (MongoDB, 2024) network access for the CI/CD pipeline. GitHub Actions runners use dynamic IP addresses that change on every run, so the Atlas default whitelist — which restricts connections to specific IPs — caused the test job's `before` hook to hang until Mocha's 20-second timeout killed it with zero tests run. The fix required two changes: opening Atlas network access to `0.0.0.0/0` (all IPs) for the test cluster, and adding `serverSelectionTimeoutMS: 10000` to the Mongoose connection options so that future connection failures produce a clear, immediate error rather than a silent hang.

A second, more conceptual challenge was deciding where the OOP domain layer (`backend/oop/`) should sit relative to the existing Mongoose models. The natural instinct was to make `AdminUser`/`StudentUser` extend the Mongoose `User` model directly, but Mongoose documents are not well suited to being subclassed (Mongoose, 2024) — schema methods and document hydration conflict with custom constructors. The resolution was to treat `BaseUser` and its subclasses as plain in-memory domain objects, built from already-persisted Mongoose data via `UserFactory`, rather than as persistence objects themselves. This kept the OOP hierarchy clean (true private fields, method overriding, polymorphic `getPermissions()`) without fighting Mongoose's own object model. The trade-off is that the two representations of "a user" (Mongoose document vs. domain object) must be kept conceptually distinct, which is documented in the JSDoc headers of each file so the boundary is explicit rather than implicit.

A smaller but instructive issue surfaced once the Chain of Responsibility was wired into `server.js`: the `SanitizationHandler` ran before Express's JSON body-parser middleware in an early draft, so `req.body` was still `undefined` when the handler tried to trim string fields. This was a useful reminder that Chain of Responsibility only solves *ordering between the handlers you control* — it does not protect against ordering mistakes relative to middleware registered outside the chain. Reordering `app.use()` so the body-parser ran first resolved it.

Extending the test coverage raised a different kind of challenge. The original suite (`sample.test.js`) was entirely integration-level — every test fired real HTTP requests against a live MongoDB Atlas connection — which meant the OOP domain classes and the seven design patterns had no *isolated* tests of their own, and the suite could not run at all without database credentials. Adding a dedicated unit suite (`backend/test/unit/`, 72 tests) forced a clear decision about the unit/integration boundary: the pure classes (Factory, Strategy, the OOP hierarchy, the Chain handlers) test trivially, but the Facade and Proxy each depend on the Mongoose models, so testing them *as units* meant replacing those collaborators with Sinon stubs (Sinon.JS, 2024) rather than touching the database. This made explicit something the integration tests had blurred — that a "unit" test of the Facade should verify its *orchestration logic* (does it check capacity before creating an enrolment, does it fire the right Observer event) independently of whether Mongoose actually persists anything. A subtle trap appeared with the Observer: because `EnrollmentEventEmitter` is exported as a shared singleton, spy subscribers added in one test leaked into the next until each test's `afterEach` explicitly called `unsubscribe()`. Finally, wiring the two suites into CI cleanly required scoping the default `.mocharc.yml` to `test/*.test.js` and giving the unit suite its own `.mocharc.unit.yml`, so `npm test` and `npm run test:unit` stay disjoint and the pipeline reports unit and integration results as separate steps. The broader lesson was that unit and integration tests answer different questions — "is this class correct in isolation?" versus "do the pieces work together against a real database?" — and a mature suite needs both rather than treating one as a substitute for the other.

For the collaboration aspect of creating this system, one of the biggest difficulties we faced was communication between members as it was hard to work around the varying schedules and responsibilities outside of the project each team member had. Sometimes it was difficult to coordinate our work and respond to each other promptly. In the future, we reflected that we would start earlier and schedule regular team meetings and assign responsibilities sooner. As well as a greater effort to respond to each would improve our overall teamwork and organisation. Overall, we are happy with the outcome of our project. We believe we have gained a better understanding of OOP principles and streamlining the development workflow with CI/CD as well as the use of Postman to develop and test our APIs. Our technical skills and our ability to work collaboratively have been strengthened and we now have valuable hands-on experience to use in the industry. 

### Collaboration and tool use

Claude (Anthropic, 2026) was used throughout this assignment as a collaborative coding and debugging assistant, in line with the unit's permitted use of AI tools. Specific uses included: debugging the bcrypt pre-save hook hang and the React auth-state persistence issue; reviewing the seven design-pattern implementations against their canonical definitions for correctness; generating the SysML diagrams (Object Management Group, 2019), Postman collection, and this README's structure; and proofreading the Reflection section above for clarity. The project's overall design-science framing follows Wieringa (2014). All architectural decisions, the choice of which seven patterns to implement and where, and the final code were reviewed and understood before submission. No AI-generated content was submitted without being read, tested, and, where necessary, corrected.

---

## References
Amazon Web Services. (2024). Getting started with Amazon EC2. https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EC2_GetStarted.html 

Anthropic. (2026). Claude (Sonnet 4.6) [Large language model]. https://claude.ai 

Atlassian. (2024). Scrum with Jira Software. https://www.atlassian.com/agile/tutorials/how-to-do-scrum-with-jira-software 

Axios. (2024). Axios HTTP client documentation. https://axios-http.com/docs/intro 

Chai. (2024). Chai assertion library documentation. https://www.chaijs.com/api/ 

Express.js. (2024). Express 4.x API reference. https://expressjs.com/en/4x/api.html 

Gamma, E., Helm, R., Johnson, R., & Vlissides, J. (1994). Design patterns: Elements of reusable object-oriented software. Addison-Wesley. 

GitHub Docs. (2024). Understanding GitHub Actions. https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions 

MDN Web Docs. (2024). Private class features. Mozilla. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties 

Mocha. (2024). Mocha — the fun, simple, flexible JavaScript test framework. https://mochajs.org 

MongoDB. (2024). MongoDB Atlas documentation. https://www.mongodb.com/docs/atlas/ 

Mongoose. (2024). Mongoose v6 documentation — getting started. https://mongoosejs.com/docs/guide.html 

Nginx. (2024). Beginner's guide to Nginx. https://nginx.org/en/docs/beginners_guide.html 

Node.js. (2024). Events — EventEmitter class. OpenJS Foundation. https://nodejs.org/api/events.html 

npm. (2024a). bcrypt package. https://www.npmjs.com/package/bcrypt 

npm. (2024b). jsonwebtoken package. https://www.npmjs.com/package/jsonwebtoken 

Object Management Group. (2019). OMG Systems Modeling Language (OMG SysML™) v1.6. https://www.omg.org/spec/SysML/1.6/PDF 

PM2. (2024). PM2 — advanced process manager for Node.js. https://pm2.keymetrics.io/docs/usage/quick-start/ 

React. (2024). React documentation — learn React. https://react.dev/learn 

Refactoring Guru. (2024). Design patterns. https://refactoring.guru/design-patterns 

Sinon.JS. (2024). Standalone test spies, stubs and mocks for JavaScript. https://sinonjs.org/ 

Tailwind Labs. (2024). Tailwind CSS documentation. https://tailwindcss.com/docs 

Wieringa, R. J. (2014). Design science methodology for information systems and software engineering. Springer. 
