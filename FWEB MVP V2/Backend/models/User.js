import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  course: {
    type: String,
  },
  description: {
    type: String,
  },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
