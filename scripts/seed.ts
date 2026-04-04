import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Admin, Client, ContentBlock, Service } from "../apps/api/src/models";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

async function upsertService(input: { title: string; description?: string; category?: string; sortOrder: number; iconUrl?: string }) {
  await Service.updateOne(
    { title: input.title },
    {
      $set: {
        title: input.title,
        description: input.description ?? undefined,
        category: input.category ?? undefined,
        sortOrder: input.sortOrder,
        iconUrl: input.iconUrl ?? undefined,
        isActive: true,
      },
    },
    { upsert: true },
  ).exec();
}

async function upsertClient(input: { name: string; description?: string; websiteUrl?: string; sortOrder: number; logoUrl?: string }) {
  await Client.updateOne(
    { name: input.name },
    {
      $set: {
        name: input.name,
        description: input.description ?? undefined,
        websiteUrl: input.websiteUrl ?? undefined,
        sortOrder: input.sortOrder,
        logoUrl: input.logoUrl ?? undefined,
        isActive: true,
      },
    },
    { upsert: true },
  ).exec();
}

async function upsertBlock(input: { key: string; title?: string; contentHtml: string; sortOrder: number }) {
  await ContentBlock.updateOne(
    { key: input.key },
    {
      $set: {
        key: input.key,
        title: input.title ?? undefined,
        contentHtml: input.contentHtml,
        sortOrder: input.sortOrder,
        isActive: true,
      },
    },
    { upsert: true },
  ).exec();
}

async function seedAdminIfConfigured() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD?.trim();
  if (!email || !password) {
    console.log("SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD not set; skipping admin seed.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await Admin.updateOne(
    { email: email.toLowerCase() },
    { $set: { email: email.toLowerCase(), passwordHash, role: "admin", isActive: true } },
    { upsert: true },
  ).exec();

  console.log(`Seeded admin: ${email}`);
}

async function main() {
  const mongodbUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/bloom_hr";
  if (!mongodbUri) throw new Error("Missing MONGODB_URI");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongodbUri);

  console.log("Seeding services...");
  const services = [
    { title: "GST Registration", description: "GST registration support for businesses with smooth compliance handoff.", category: "GST", sortOrder: 1 },
    { title: "MSME", description: "MSME registration guidance and documentation support.", category: "MSME", sortOrder: 2 },
    { title: "Payroll Management", description: "Payroll processing, salary structuring, and monthly payroll support.", category: "Payroll", sortOrder: 3 },
    { title: "Recruitment", description: "Workforce hiring support with HR process guidance and documentation.", category: "HR", sortOrder: 4 },
    { title: "PF & ESI", description: "Provident Fund and ESI setup, updates, and compliance coordination.", category: "Statutory", sortOrder: 5 },
    { title: "Tax Filing", description: "Assistance for tax filing workflows and documentation readiness.", category: "Tax", sortOrder: 6 },
    { title: "Labour Law Compliance", description: "Operational compliance support tailored to your workforce needs.", category: "Labour", sortOrder: 7 },
    { title: "Statutory Compliance", description: "Audit-ready statutory compliance management for growing organizations.", category: "Compliance", sortOrder: 8 },
  ];
  for (const s of services) await upsertService(s);

  console.log("Seeding clients...");
  const clients = [
    { name: "A2B Adyar Anandha Bhavan", sortOrder: 1, description: "Client partner for workforce administration and compliance support." },
    { name: "SK Enterprises", sortOrder: 2, description: "Ongoing HR and statutory guidance for operational growth." },
  ];
  for (const c of clients) await upsertClient(c);

  console.log("Seeding CMS content blocks...");
  const blocks = [
    {
      key: "about",
      title: "About",
      sortOrder: 1,
      contentHtml:
        "<p><strong>Bloom HR Solutions</strong> helps organizations manage payroll, statutory compliance, and workforce operations with clarity and accountability. We streamline HR administration so your team can focus on growth.</p><p>From onboarding support to ongoing compliance coordination, our approach is structured, transparent, and audit-ready.</p>",
    },
    {
      key: "whyChooseUs",
      title: "Why Choose Us",
      sortOrder: 2,
      contentHtml:
        "<ul><li><strong>Compliance-first:</strong> designed around real audit expectations.</li><li><strong>Fast turnaround:</strong> clear next steps and measurable outcomes.</li><li><strong>Client-ready processes:</strong> documentation and workflows built for business owners.</li><li><strong>Transparent communication:</strong> no ambiguity in requirements and status.</li></ul>",
    },
    {
      key: "contactHeading",
      title: "Contact Heading",
      sortOrder: 3,
      contentHtml: "<p>Have questions about payroll, compliance, or workforce administration?</p>",
    },
    {
      key: "contactSubheading",
      title: "Contact Subheading",
      sortOrder: 4,
      contentHtml: "<p>Send your requirements and we’ll respond with a clear action plan.</p>",
    },
    {
      key: "contactPhone",
      title: "Contact Phone",
      sortOrder: 5,
      contentHtml: "<p>+91 8903476936</p>",
    },
    {
      key: "contactEmail",
      title: "Contact Email",
      sortOrder: 6,
      contentHtml: "<p>bloomskhrsolutions@gmail.com</p>",
    },
    {
      key: "contactAddress",
      title: "Contact Address",
      sortOrder: 7,
      contentHtml: "<p>Chennai, India</p>",
    },
  ];
  for (const b of blocks) await upsertBlock(b);

  await seedAdminIfConfigured();

  console.log("Seed complete.");
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

