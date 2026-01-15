import mongoose from "mongoose";

const sessionRequestSchema = new mongoose.Schema({
  learnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  sessionTime: {
    type: String,
  },
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected", "Completed"],
    default: "Pending",
  },
  hiddenByLearner: {
    type: Boolean,
    default: false,
  },
  hiddenByTutor: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export default mongoose.model("SessionRequest", sessionRequestSchema);
