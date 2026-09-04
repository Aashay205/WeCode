import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import type { AuthTokenPayload, AuthUser } from "../types/auth.js";

const scrypt = promisify(scryptCallback);
const TOKEN_EXPIRY = "7d";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return secret;
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const storedKey = Buffer.from(key, "hex");
  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
}

function createToken(user: AuthUser) {
  return jwt.sign({ userId: user.userId, username: user.username }, getJwtSecret(), {
    subject: user.userId,
    expiresIn: TOKEN_EXPIRY,
  });
}

export async function registerUser(email: string, username: string, password: string) {
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: email.toLowerCase(),
      username,
      passwordHash: await hashPassword(password),
    },
  });
  const authUser = { userId: user.id, username: user.username };
  return { user: authUser, token: createToken(authUser) };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) return null;

  const authUser = { userId: user.id, username: user.username };
  return { user: authUser, token: createToken(authUser) };
}

export function verifyToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, getJwtSecret());
  if (typeof payload === "string" || typeof payload.userId !== "string" || typeof payload.username !== "string") {
    throw new Error("Invalid authentication token");
  }
  return payload as AuthTokenPayload;
}