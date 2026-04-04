import path from "node:path";
import fs from "node:fs/promises";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

import { config } from "../config";

function sanitizeKeyComponent(input: string): string {
  const base = input.replace(/\\/g, "/").split("/").pop() ?? "file";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function buildPublicUrl(storageKey: string): string {
  const base = config.s3.publicBaseUrl;
  if (base) return `${base.replace(/\/$/g, "")}/${storageKey}`;

  // Fallback: endpoint/bucket/key style (works for many S3-compatible systems).
  if (config.s3.endpoint) {
    const ep = config.s3.endpoint.replace(/\/$/g, "");
    return `${ep}/${config.s3.bucket}/${storageKey}`;
  }

  // Last resort: storageUrl unknown; callers should ensure publicBaseUrl is set in production.
  return storageKey;
}

export const s3 = new S3Client({
  region: config.s3.region,
  endpoint: config.s3.endpoint ? config.s3.endpoint : undefined,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
  forcePathStyle: config.s3.forcePathStyle,
});

export async function uploadMediaToS3(params: {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  keyPrefix?: string;
}): Promise<{ storageUrl: string; s3Key: string; mimeType: string }> {
  const { buffer, originalName, mimeType } = params;
  const keyPrefix = params.keyPrefix ?? "media";

  const filename = sanitizeKeyComponent(originalName);
  const ext = path.extname(filename);
  const nameWithoutExt = ext ? filename.slice(0, -ext.length) : filename;

  const s3Key = `${keyPrefix}/${Date.now()}-${nameWithoutExt}${ext || ""}`.replace(/\\/g, "/");

  if (config.mediaStorage === "local") {
    const parts = s3Key.split("/");
    const filePath = path.join(config.localMedia.uploadsDir, ...parts);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);

    const storageUrl = `${config.localMedia.publicBaseUrl.replace(/\/$/g, "")}/uploads/${s3Key}`;
    return { storageUrl, s3Key, mimeType };
  }

  const command = new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: s3Key,
    Body: buffer,
    ContentType: mimeType,
    ACL: config.s3.publicRead ? "public-read" : undefined,
  });

  await s3.send(command);

  const storageUrl = buildPublicUrl(s3Key);
  return { storageUrl, s3Key, mimeType };
}

export async function deleteMediaFromS3(s3Key: string): Promise<void> {
  if (!s3Key) return;
  if (config.mediaStorage === "local") {
    const parts = s3Key.split("/");
    const filePath = path.join(config.localMedia.uploadsDir, ...parts);
    await fs.unlink(filePath).catch(() => {});
    return;
  }

  await s3.send(new DeleteObjectCommand({ Bucket: config.s3.bucket, Key: s3Key }));
}

