import express from "express";
import SessionRequest from "../models/SessionRequest.js";
import TutorListing from "../models/TutorListing.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: SessionRequests
 *   description: Session request management
 */

/**
 * @swagger
 * /sessionrequests:
 *   post:
 *     tags: [SessionRequests]
 *     summary: Create a new session request
 *     description: Learner requests a tutoring session for a tutor listing.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - listingId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 64f0a7c8f2b2c21a9c1a1234
 *               listingId:
 *                 type: string
 *                 example: 64f0a7c8f2b2c21a9c1a5678
 *               sessionTime:
 *                 type: string
 *                 example: Mon & Fri, 1-5pm
 *     responses:
 *       201:
 *         description: Session request created
 *       400:
 *         description: Bad request
 *       403:
 *         description: Not authorized
 */
router.post("/", async (req, res) => {
  const { userId, listingId, sessionTime } = req.body;

  // Basic payload validation
  if (!userId || !listingId) {
    return res.status(400).json({ success: false, message: "userId and listingId are required" });
  }

  try {
    // Ensure listing exists
    const listing = await TutorListing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: "Tutor listing not found" });
    }

    // Learners cannot request their own listings
    if (String(listing.tutorId) === String(userId)) {
      return res.status(403).json({ success: false, message: "You cannot request your own listing" });
    }

    // Prevent duplicate active requests
    const exists = await SessionRequest.findOne({
      learnerId: userId,
      tutorId: listing.tutorId,
      subject: listing.subject,
      sessionTime: sessionTime || listing.availability || "",
      status: { $in: ["Pending", "Accepted"] },
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "You already have an active request for this session",
      });
    }

    // Create session request
    const request = await SessionRequest.create({
      learnerId: userId,
      tutorId: listing.tutorId,
      subject: listing.subject,
      sessionTime: sessionTime || listing.availability || "",
      status: "Pending",
    });

    const populated = await SessionRequest.findById(request._id)
      .populate("learnerId", "fullName email course")
      .populate("tutorId", "fullName email course");

    return res.status(201).json({ success: true, request: populated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /sessionrequests/inbox/{userId}:
 *   get:
 *     tags: [SessionRequests]
 *     summary: Get tutor inbox requests
 *     description: Returns session requests where the user is the tutor (Inbox).
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inbox requests returned
 *       403:
 *         description: Not authorized
 */
router.get("/inbox/:userId", async (req, res) => {
  const { userId } = req.params;
  const { userId: qUserId } = req.query;

  // Simple auth check
  if (!qUserId || String(qUserId) !== String(userId)) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  try {
    const requests = await SessionRequest.find({
      tutorId: userId,
      hiddenByTutor: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .populate("learnerId", "fullName email course")
      .populate("tutorId", "fullName email course");

    return res.status(200).json({ success: true, requests });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /sessionrequests/outbox/{userId}:
 *   get:
 *     tags: [SessionRequests]
 *     summary: Get learner requests
 *     description: Returns session requests where the user is the learner (My Requests).
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Outbox requests returned
 *       403:
 *         description: Not authorized
 */
router.get("/outbox/:userId", async (req, res) => {
  const { userId } = req.params;
  const { userId: qUserId } = req.query;

  if (!qUserId || String(qUserId) !== String(userId)) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  try {
    const requests = await SessionRequest.find({
      learnerId: userId,
      hiddenByLearner: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .populate("learnerId", "fullName email course")
      .populate("tutorId", "fullName email course");

    return res.status(200).json({ success: true, requests });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /sessionrequests/{id}/status:
 *   put:
 *     tags: [SessionRequests]
 *     summary: Update session request status
 *     description: Tutor updates request status (Accepted, Rejected, Completed).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - status
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 64f0a7c8f2b2c21a9c1a1234
 *               status:
 *                 type: string
 *                 enum: [Accepted, Rejected, Completed]
 *     responses:
 *       200:
 *         description: Status updated
 *       403:
 *         description: Not authorized
 */
router.put("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { userId, status } = req.body;

  if (!userId || !status) {
    return res.status(400).json({ success: false, message: "userId and status are required" });
  }

  if (!["Accepted", "Rejected", "Completed"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  try {
    const request = await SessionRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Session request not found" });
    }

    // Only tutor can update status
    if (String(request.tutorId) !== String(userId)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    request.status = status;
    await request.save();

    const populated = await SessionRequest.findById(id)
      .populate("learnerId", "fullName email course")
      .populate("tutorId", "fullName email course");

    return res.status(200).json({ success: true, request: populated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /sessionrequests/{id}:
 *   delete:
 *     tags: [SessionRequests]
 *     summary: Remove a session request from the user's list
 *     description: Soft-removes the session request for the current user.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Removed from the user's list
 *       403:
 *         description: Not authorized
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: "userId is required" });
  }

  try {
    const request = await SessionRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Session request not found" });
    }

    const isTutor = String(request.tutorId) === String(userId);
    const isLearner = String(request.learnerId) === String(userId);

    if (!isTutor && !isLearner) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (isTutor) request.hiddenByTutor = true;
    if (isLearner) request.hiddenByLearner = true;

    await request.save();
    return res.status(200).json({ success: true, message: "Removed" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
