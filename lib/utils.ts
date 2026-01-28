import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId() {
  return Date.now() + "-" + Math.random().toString(36).substr(2, 9);
}

export function generateOneTimeToken(bytes = 32) {
  // 32 bytes => 64 hex chars
  return crypto.randomBytes(bytes).toString("hex");
}

export function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}
