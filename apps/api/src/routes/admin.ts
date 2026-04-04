import { Router } from "express";
import { Client, Lead, Service, Testimonial } from "../models";
import { adminOnly } from "../middleware/adminAuth";

export const adminRoutes = Router();

adminRoutes.get("/api/admin/analytics", adminOnly, async (_req, res) => {
  const [leads, services, clients, testimonials] = await Promise.all([
    Lead.countDocuments({}),
    Service.countDocuments({}),
    Client.countDocuments({}),
    Testimonial.countDocuments({}),
  ]);

  return res.json({
    totalLeads: leads,
    totalServices: services,
    totalClients: clients,
    totalTestimonials: testimonials,
  });
});

