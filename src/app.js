import { globalAuth } from "./middlewares/authMiddleware.js";
import apiRoutes from "./routes.js";
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());

app.use(express.json());
app.use("/api/v1", globalAuth, apiRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Ocurrió un error inesperado en el servidor",
  });
});

export default app;
