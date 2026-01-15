import express from "express";
import User from "../models/User.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     tags: [Users]
 *     summary: Register a new user
 *     description: Creates a new user account (fullName, email, course, description, password).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - course
 *               - description
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Tan
 *               email:
 *                 type: string
 *                 example: john.tan@student.tp.edu.sg
 *               course:
 *                 type: string
 *                 example: Information Technology
 *               description:
 *                 type: string
 *                 example: Year 2 IT student looking for help in Full Stack Web Development.
 *               password:
 *                 type: string
 *                 example: john123
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Missing/invalid fields
 *       409:
 *         description: Email already in use
 *       500:
 *         description: Server error
 */
router.post("/register", async (req, res) => {
  const { fullName, email, course, description, password } = req.body;

  // basic validation
  if (!fullName || !email || !course || !description || !password) {
    return res.status(400).json({
      success: false,
      message: "fullName, email, course, description and password are required",
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  if (!cleanEmail) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    // check duplicate email
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already in use",
      });
    }

    const user = await User.create({
      fullName,
      email: cleanEmail,
      course,
      description,
      password,
    });

    return res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        course: user.course,
        description: user.description,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * @swagger
 * /users/login:
 *   post:
 *     tags: [Users]
 *     summary: User login
 *     description: Logs in using MongoDB user data (email + password). Returns user with _id for frontend.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: john.tan@student.tp.edu.sg
 *               password:
 *                 type: string
 *                 example: john123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid login
 *       500:
 *         description: Server error
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(401).json({
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });

    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid login",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        course: user.course,
        description: user.description,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user profile
 *     description: Updates the logged-in user's profile (MVP ownership check using userId in body).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - fullName
 *               - email
 *               - course
 *               - description
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 65a1234567890abcdef12345
 *               fullName:
 *                 type: string
 *                 example: John Tan
 *               email:
 *                 type: string
 *                 example: john.tan@student.tp.edu.sg
 *               course:
 *                 type: string
 *                 example: Engineering Design with Business
 *               description:
 *                 type: string
 *                 example: I can tutor FWEB and JavaScript basics.
 *               password:
 *                 type: string
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Bad request
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already in use
 *       500:
 *         description: Server error
 */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { userId, fullName, email, course, description, password } = req.body;

  if (!userId || String(userId) !== String(id)) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update this profile",
    });
  }

  try {
    const updateFields = {};

    if (typeof fullName === "string") updateFields.fullName = fullName;
    if (typeof course === "string") updateFields.course = course;
    if (typeof description === "string") updateFields.description = description;

    if (typeof email === "string") {
      const newEmail = email.trim().toLowerCase();
      if (!newEmail) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const existing = await User.findOne({ email: newEmail });
      if (existing && String(existing._id) !== String(id)) {
        return res.status(409).json({
          success: false,
          message: "Email already in use",
        });
      }

      updateFields.email = newEmail;
    }

    if (typeof password === "string" && password.trim() !== "") updateFields.password = password;

    const updated = await User.findByIdAndUpdate(id, { $set: updateFields }, { new: true, runValidators: true });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: updated._id,
        fullName: updated.fullName,
        email: updated.email,
        course: updated.course,
        description: updated.description,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user profile
 *     description: Deletes the logged-in user's profile (MVP ownership check using userId in body).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 65a1234567890abcdef12345
 *     responses:
 *       200:
 *         description: Profile deleted
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId || String(userId) !== String(id)) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to delete this profile",
    });
  }

  try {
    const deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile deleted",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;
