import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  sessionRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SessionRequest",
    required: true,
    unique: true,
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  learnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  score: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  comment: {
    type: String,
  },
}, { timestamps: true });

export default mongoose.model("Rating", ratingSchema);
