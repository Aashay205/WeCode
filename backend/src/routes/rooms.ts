import { randomBytes } from "node:crypto";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { verifyToken } from "../services/auth.js";

const router = Router();
const supportedLanguages = new Set(["javascript", "python", "cpp", "java"]);

router.post("/", async (req, res) => {
  const authorization = req.header("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  let userId: string;
  try {
    userId = verifyToken(token).userId;
  } catch {
    res.status(401).json({ error: "Invalid authentication token" });
    return;
  }

  const requestedLanguage = req.body?.language;
  const language = typeof requestedLanguage === "string" && supportedLanguages.has(requestedLanguage)
    ? requestedLanguage
    : "javascript";

  try {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const roomId = randomBytes(6).toString("hex");
      try {
        const room = await prisma.room.create({
          data: {
            id: roomId,
            hostUserId: userId,
            language,
            code: "",
          },
        });
        res.status(201).json({ roomId: room.id, language: room.language });
        return;
      } catch (error: unknown) {
        if (error && typeof error === "object" && "code" in error && error.code === "P2002") continue;
        throw error;
      }
    }
    res.status(503).json({ error: "Unable to create a unique room" });
  } catch {
    res.status(500).json({ error: "Unable to create room" });
  }
});

export default router;