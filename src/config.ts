import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  STABILITY_AI_API_KEY: z.string().min(1, "STABILITY_AI_API_KEY is required"),
  IMAGE_STORAGE_DIRECTORY: z.string().min(1, "IMAGE_STORAGE_DIRECTORY is required"),
});

export const env = envSchema.parse(process.env); 