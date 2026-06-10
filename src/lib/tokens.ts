import { randomBytes } from "crypto";

export function generateSessionToken() {
  return randomBytes(32).toString("hex");
}

export function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}