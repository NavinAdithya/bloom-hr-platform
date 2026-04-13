import http from "node:http";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { Server as SocketIOServer } from "socket.io";

import { config } from "./config";
import { connectMongo } from "./db";
import { routes } from "./routes/index";

async function main() {
  await connectMongo();

  const app = express();

  if (config.mediaStorage === "local") {
    // Serve local uploaded assets in development/testing mode.
    app.use("/uploads", express.static(config.localMedia.uploadsDir));
  }

  app.use(helmet());
  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "2mb" }));

  // Global limiter (tune later if needed)
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
    }),
  );

  app.use(routes);

  // Global async error handler — catches unhandled promise rejections from all routes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[API Error]", err?.message ?? err);
    if (res.headersSent) return;
    res.status(500).json({ error: "Internal server error" });
  });

  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: config.frontendUrl,
      credentials: true,
    },
  });

  // Attach io to app for routers/services to broadcast.
  app.set("io", io);

  io.on("connection", (socket) => {
    // Rooms can be added later (e.g., admin-only). For now we broadcast globally.
    socket.on("disconnect", () => {});
  });

  server.listen(config.apiPort, () => {
    // eslint-disable-next-line no-console
    console.log(`Bloom API listening on port ${config.apiPort}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

