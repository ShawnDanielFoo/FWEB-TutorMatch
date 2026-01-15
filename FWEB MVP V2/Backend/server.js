import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

import usersRouter from "./routes/users.js";
import tutorListsRouter from "./routes/tutorlists.js";
import sessionRequestRoutes from "./routes/sessionrequests.js";
import ratingRoutes from "./routes/ratings.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TutorMatch API",
      version: "1.0.0",
      description: "API documentation for FWEB MVP",
    },
  },
  apis: ["./routes/*.js"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use("/users", usersRouter);
app.use("/tutorlists", tutorListsRouter);
app.use("/sessionrequests", sessionRequestRoutes);
app.use("/ratings", ratingRoutes);

app.get("/", (req, res) => {
  res.send("<h1>API running successfully</h1>");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB error:", err));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
