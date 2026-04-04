import { Router } from "express";
import { authRoutes } from "./auth";
import { adminRoutes } from "./admin";
import { mediaRoutes } from "./media";
import { servicesRoutes } from "./services";
import { clientsRoutes } from "./clients";
import { testimonialsRoutes } from "./testimonials";
import { cmsBlocksRoutes } from "./cmsBlocks";
import { leadsRoutes } from "./leads";

export const routes = Router();

// Health checks
routes.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, name: "Bloom HR Solutions API" });
});

// Auth (admin)
routes.use(authRoutes);

// Admin (protected)
routes.use(adminRoutes);
routes.use(mediaRoutes);
routes.use(servicesRoutes);
routes.use(clientsRoutes);
routes.use(testimonialsRoutes);
routes.use(cmsBlocksRoutes);
routes.use(leadsRoutes);

