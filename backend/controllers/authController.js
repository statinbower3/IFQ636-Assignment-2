/**
 * @file authController.js
 * @description Handles user registration, login, and profile management.
 *
 * PATTERNS USED:
 *  - Factory  : UserFactory.createUser() produces the correct domain object
 *               (AdminUser or StudentUser) based on the stored role. The
 *               controller never instantiates these classes directly.
 *  - Singleton: connectDB (via db.js) ensures one shared DB connection.
 *
 * OOP CONCEPTS:
 *  - Polymorphism : The controller calls `.getPermissions()` and `.describe()`
 *                   on whichever object UserFactory returns. The behaviour
 *                   differs for admins vs students without any if/else here.
 *  - Encapsulation: JWT generation is hidden in the private `_generateToken()`
 *                   function; callers use it without knowing the implementation.
 */

const User        = require('../models/User');
const jwt         = require('jsonwebtoken');
const bcrypt      = require('bcrypt');
const UserFactory = require('../patterns/factory/UserFactory');

// ─── Private Helper (Encapsulation) ───────────────────────────────────────────

/**
 * Generates a signed JWT for the given user ID.
 * Kept private to this module — not exported.
 *
 * @param {string} id - MongoDB ObjectId of the user.
 * @returns {string} Signed JWT valid for 30 days.
 */
const _generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ─── Controller Functions ──────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Registers a new user as 'student' (default role).
 *
 * FACTORY: After saving to MongoDB, UserFactory.createUser() is called so the
 * controller works with a typed domain object (StudentUser) rather than a
 * raw Mongoose document.
 *
 * @param {import('express').Request}  req - Body: { name, email, password }
 * @param {import('express').Response} res
 */
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Check for duplicate email.
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Persist new user; password is hashed by the pre-save Mongoose hook.
    const savedUser = await User.create({ name, email, password });

    // FACTORY: Create the appropriate domain object for this role.
    const userDomain = UserFactory.createUser({
      id:   savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
      role:  savedUser.role,   // 'student' by default
    });

    console.log(`[Auth] New user registered — ${userDomain.describe()}`);
    console.log(`[Auth] Permissions: ${userDomain.getPermissions().join(', ')}`);

    // Respond with safe user data + token (no password field).
    return res.status(201).json({
      id:    savedUser.id,
      name:  savedUser.name,
      email: savedUser.email,
      role:  savedUser.role,
      token: _generateToken(savedUser.id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/auth/login
 * Authenticates a user by email and password.
 *
 * FACTORY: After verifying credentials, UserFactory produces the role-correct
 * domain object. Its `.getPermissions()` is logged (demonstrates polymorphism —
 * admin and student return different permission arrays from the same call).
 *
 * @param {import('express').Request}  req - Body: { email, password }
 * @param {import('express').Response} res
 */
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // FACTORY + POLYMORPHISM: both AdminUser and StudentUser respond to
      // .getPermissions() but return different sets.
      const userDomain = UserFactory.createUser({
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      });

      console.log(`[Auth] Login — ${userDomain.describe()}`);
      console.log(`[Auth] Granted permissions: ${userDomain.getPermissions().join(', ')}`);

      return res.json({
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        token: _generateToken(user.id),
      });
    }

    return res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/auth/profile
 * Returns the authenticated user's profile (requires `protect` middleware).
 *
 * @param {import('express').Request}  req - req.user is set by the auth chain.
 * @param {import('express').Response} res
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      name:       user.name,
      email:      user.email,
      university: user.university,
      address:    user.address,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * PUT /api/auth/profile
 * Updates the authenticated user's profile fields.
 *
 * @param {import('express').Request}  req - Body: { name?, email?, university?, address? }
 * @param {import('express').Response} res
 */
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, university, address } = req.body;

    // Apply only the fields that were provided in the request.
    user.name       = name       || user.name;
    user.email      = email      || user.email;
    user.university = university || user.university;
    user.address    = address    || user.address;

    const updatedUser = await user.save();

    return res.json({
      id:         updatedUser.id,
      name:       updatedUser.name,
      email:      updatedUser.email,
      university: updatedUser.university,
      address:    updatedUser.address,
      token:      _generateToken(updatedUser.id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, updateUserProfile, getProfile };
