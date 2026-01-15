import express from "express";
import mongoose from "mongoose";
import Rating from "../models/Rating.js";
import SessionRequest from "../models/SessionRequest.js";

const router = express.Router();

/**
 * @swagger
 * /ratings:
 *   post:
 *     tags: [Ratings]
 *     summary: Rate a completed session
 *     description: Learner rates tutor after a session is completed.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - sessionRequestId
 *               - score
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 64f0a7c8f2b2c21a9c1a1234
 *               sessionRequestId:
 *                 type: string
 *                 example: 64f0a7c8f2b2c21a9c1a9999
 *               score:
 *                 type: number
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: Very helpful and clear explanations!
 *     responses:
 *       201:
 *         description: Rating created
 *       400:
 *         description: Bad request
 *       403:
 *         description: Not authorized
 */
router.post("/", async (req, res) => {
  const { userId, sessionRequestId, score, comment } = req.body;

  // Ensure required fields are present
  if (!userId || !sessionRequestId || score === undefined) {
    return res.status(400).json({
      success: false,
      message: "userId, sessionRequestId and score are required",
    });
  }

  // Validate object IDs
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(sessionRequestId)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid userId or sessionRequestId",
    });
  }

  // Check if score is a valid 1–5 integer
  const s = Number(score);
  if (!Number.isInteger(s) || s < 1 || s > 5) {
    return res.status(400).json({
      success: false,
      message: "Score must be an integer from 1 to 5",
    });
  }

  try {
    // Look up the session to confirm it's valid
    const session = await SessionRequest.findById(sessionRequestId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    // Only the learner who booked the session can rate it
    if (String(session.learnerId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Only the learner can rate this session",
      });
    }

    // Rating is allowed only after session completion
    if (session.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "Only completed sessions can be rated",
      });
    }

    // Prevent rating the same session more than once
    const existing = await Rating.findOne({ sessionRequestId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Session already rated",
      });
    }

    // Create new rating
    const rating = await Rating.create({
      sessionRequestId,
      tutorId: session.tutorId,
      learnerId: session.learnerId,
      score: s,
      comment: comment || "",
    });

    // Return full populated rating object
    const populated = await Rating.findById(rating._id)
      .populate("tutorId", "fullName email course description")
      .populate("learnerId", "fullName email course description")
      .populate("sessionRequestId");

    return res.status(201).json({ success: true, rating: populated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /ratings/tutor/{tutorId}:
 *   get:
 *     tags: [Ratings]
 *     summary: Get tutor average rating
 *     description: Returns average rating score and total count for a tutor.
 *     parameters:
 *       - in: path
 *         name: tutorId
 *         required: true
 *         schema:
 *           type: string
 *         example: 64f0a7c8f2b2c21a9c1a1234
 *     responses:
 *       200:
 *         description: Tutor rating summary returned
 */
router.get("/tutor/:tutorId", async (req, res) => {
  const { tutorId } = req.params;

  // Validate tutorId format
  if (!mongoose.Types.ObjectId.isValid(tutorId)) {
    return res.status(400).json({ success: false, message: "Invalid tutorId" });
  }

  try {
    // Calculate average rating and total count using aggregation
    const result = await Rating.aggregate([
      { $match: { tutorId: new mongoose.Types.ObjectId(tutorId) } },
      {
        $group: {
          _id: "$tutorId",
          average: { $avg: "$score" },
          count: { $sum: 1 },
        },
      },
    ]);

    if (!result.length) {
      return res.status(200).json({ success: true, average: 0, count: 0 });
    }

    return res.status(200).json({
      success: true,
      average: result[0].average,
      count: result[0].count,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /ratings/learner/{learnerId}:
 *   get:
 *     tags: [Ratings]
 *     summary: Get learner ratings list
 *     description: Returns all ratings made by a learner (used to lock history rating UI).
 *     parameters:
 *       - in: path
 *         name: learnerId
 *         required: true
 *         schema:
 *           type: string
 *         example: 64f0a7c8f2b2c21a9c1a1234
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         example: 64f0a7c8f2b2c21a9c1a1234
 *     responses:
 *       200:
 *         description: Learner ratings returned
 *       403:
 *         description: Not authorized
 */
router.get("/learner/:learnerId", async (req, res) => {
  const { learnerId } = req.params;
  const { userId } = req.query;

  // Authorization: learners can only fetch their own ratings
  if (!userId || String(userId) !== String(learnerId)) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  if (!mongoose.Types.ObjectId.isValid(learnerId)) {
    return res.status(400).json({ success: false, message: "Invalid learnerId" });
  }

  try {
    const ratings = await Rating.find({ learnerId })
      .select("score comment tutorId learnerId sessionRequestId createdAt")
      .populate("tutorId", "fullName email course description")
      .populate("sessionRequestId");

    return res.status(200).json({ success: true, ratings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
