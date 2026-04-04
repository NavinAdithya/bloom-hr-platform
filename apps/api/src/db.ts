import mongoose from "mongoose";
import { config } from "./config";

let isConnected = false;

export async function connectMongo(): Promise<void> {
  if (isConnected) return;
  mongoose.set("strictQuery", true);
  await mongoose.connect(config.mongodbUri);
  isConnected = true;
}

