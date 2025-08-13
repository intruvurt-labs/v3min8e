import "dotenv/config";
import express from "express";
import cors from "cors";
import { setupRoutes } from "./routes/index";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Setup all API routes including NimRev Scanner
  setupRoutes(app);

  return app;
}
