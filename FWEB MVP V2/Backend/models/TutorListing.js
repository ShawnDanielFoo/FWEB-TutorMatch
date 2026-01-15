import mongoose from "mongoose";

const tutorListingSchema = new mongoose.Schema({
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  availability: {
    type: String, 
  },
}, { timestamps: true });

export default mongoose.model("TutorListing", tutorListingSchema);
