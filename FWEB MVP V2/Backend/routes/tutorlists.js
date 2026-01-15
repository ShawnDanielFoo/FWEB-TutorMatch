import express from "express";
import TutorList from "../models/TutorListing.js";

const router = express.Router();

/**
 * @swagger
 * /tutorlists:
 *   get:
 *     summary: Get all tutor listings
 *     tags:
 *       - TutorLists
 *     responses:
 *       200:
 *         description: List of tutor listings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Server error
 */
router.get("/", async (req, res) => {
  try {
    // Fetch all tutor listings with basic tutor info
    const lists = await TutorList.find().populate("tutorId", "fullName email course description");
    res.json(lists);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /tutorlists:
 *   post:
 *     summary: Create a tutor listing
 *     tags:
 *       - TutorLists
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - description
 *               - availability
 *             properties:
 *               subject:
 *                 type: string
 *                 example: FWEB (CIT2C20)
 *               description:
 *                 type: string
 *                 example: Able to tutor React Router and MongoDB basics.
 *               availability:
 *                 type: string
 *                 example: Every Monday and Friday, 3PM - 6PM
 *     responses:
 *       201:
 *         description: Tutor listing created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad request
 */
router.post("/", async (req, res) => {
  try {
    // Create and save a new tutor listing
    const newList = new TutorList(req.body);
    const saved = await newList.save();

    // Populate tutor's name and email for response
    const populated = await TutorList.findById(saved._id).populate("tutorId", "fullName email");
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /tutorlists/{id}:
 *   put:
 *     summary: Update a tutor listing
 *     tags:
 *       - TutorLists
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB _id of the tutor listing to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *                 example: FWEB (Updated)
 *               description:
 *                 type: string
 *                 example: Updated details for this tutor listing.
 *               availability:
 *                 type: string
 *                 example: Monday and Friday, 5PM - 8PM
 *     responses:
 *       200:
 *         description: Tutor listing updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad request
 *       404:
 *         description: Tutor listing not found
 */
router.put("/:id", async (req, res) => {
  try {
    // Update listing and return the new version
    const updated = await TutorList.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Tutor listing not found" });
    }

    const populated = await TutorList.findById(updated._id).populate("tutorId", "fullName email");
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /tutorlists/{id}:
 *   delete:
 *     summary: Delete a tutor listing
 *     tags:
 *       - TutorLists
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB _id of the tutor listing to delete
 *     responses:
 *       200:
 *         description: Tutor listing deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tutor listing deleted
 *       404:
 *         description: Tutor listing not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", async (req, res) => {
  try {
    // Delete a listing by its ID
    const deleted = await TutorList.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Tutor listing not found" });
    }

    res.json({ message: "Tutor listing deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
