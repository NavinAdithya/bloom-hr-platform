import dotenv from "dotenv";
import path from "node:path";

// Load .env from repo root when running from `apps/api`.
const repoRoot = path.resolve(process.cwd(), "..", "..");
const defaultEnvPath = path.join(repoRoot, ".env");
const envPath = process.env.DOTENV_PATH ?? defaultEnvPath;

dotenv.config({ path: envPath });

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const config = {
  webPort: Number(process.env.WEB_PORT ?? 3000),
  apiPort: Number(process.env.API_PORT ?? 4000),

  mongodbUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/bloom_hr",

  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "7d",

  frontendUrl: process.env.FRONTEND_URL ?? "https://sk-bloom-hr-solutions.netlify.app",

  cookieSecure: (process.env.COOKIE_SECURE ?? "false").toLowerCase() === "true",
  cookieSameSite: (process.env.COOKIE_SAME_SITE ?? "lax") as "lax" | "strict" | "none",
  adminTokenCookieName: process.env.ADMIN_TOKEN_COOKIE_NAME ?? "admin_token",

  mediaStorage: (process.env.MEDIA_STORAGE ?? "").toLowerCase() || (process.env.S3_BUCKET ? "s3" : "local"),

  s3: {
    endpoint: process.env.S3_ENDPOINT ?? "",
    region: process.env.S3_REGION ?? "us-east-1",
    bucket: process.env.S3_BUCKET ?? "",
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL ?? "",
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    publicRead: (process.env.S3_PUBLIC_READ ?? "true").toLowerCase() === "true",
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? "true").toLowerCase() === "true",
  },

  localMedia: {
    uploadsDir: (() => {
      const envDir = process.env.LOCAL_MEDIA_DIR;
      const fallback = path.join(repoRoot, "apps", "api", "uploads");
      if (!envDir) return fallback;
      return path.isAbsolute(envDir) ? envDir : path.resolve(repoRoot, envDir);
    })(),
    publicBaseUrl: process.env.LOCAL_MEDIA_PUBLIC_BASE_URL ?? `http://localhost:${Number(process.env.API_PORT ?? 4000)}`,
  },

  seedAdminEmail: process.env.SEED_ADMIN_EMAIL ?? "",
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? "",

  // Email Configuration (SMTP)
  email: {
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.SMTP_FROM ?? "support.skbloomhrsolutions@gmail.com",
    to: process.env.SMTP_TO ?? "bloomskhrsolutions@gmail.com",
  },
};

