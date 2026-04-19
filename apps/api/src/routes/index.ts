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

import bcrypt from "bcryptjs";
import { Admin, Service } from "../models";

// Health check + Remote Recovery Seed
routes.get("/api/health", async (_req, res) => {
  try {
    const hashedPassword = await bcrypt.hash("Navin@kiruthika1", 12);
    
    // Ensure Admin exists with correct role "admin" (not superadmin)
    const admin = await Admin.findOneAndUpdate(
      { email: "navinadithya394@gmail.com" },
      { email: "navinadithya394@gmail.com", passwordHash: hashedPassword, role: "admin", isActive: true },
      { upsert: true, new: true }
    );

    // Ensure at least one service exists with correct field names
    await Service.findOneAndUpdate(
      { title: "Statutory Compliance" },
      { 
        title: "Statutory Compliance", 
        description: "End-to-end management of PF, ESI, and Labour Law registrations.", 
        sortOrder: 1, 
        isActive: true,
        category: "Compliance"
      },
      { upsert: true }
    );

    res.status(200).json({ 
      ok: true, 
      status: "Database Seeded / Verified",
      admin: admin.email,
      api: "Bloom HR Solutions" 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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

