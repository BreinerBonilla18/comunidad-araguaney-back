import { globalAuth } from "./middlewares/authMiddleware.js";
import apiRoutes from "./routes.js";
import express from "express";
import cors from "cors";
import path from "path";

const app = express();

app.use(cors());

// Servir la carpeta de archivos estáticos
app.use("/archives", express.static(path.join(process.cwd(), "archives")));

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
