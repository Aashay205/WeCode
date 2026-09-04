import { Router } from "express";
import { loginUser, registerUser } from "../services/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { email, username, password } = req.body as Record<string, unknown>;
  if (typeof email !== "string" || typeof username !== "string" || typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Email, username, and a password of at least 8 characters are required" });
    return;
  }

  try {
    res.status(201).json(await registerUser(email.trim(), username.trim(), password));
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      res.status(409).json({ error: "That email is already registered" });
      return;
    }
    res.status(500).json({ error: "Unable to create account" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body as Record<string, unknown>;
  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const result = await loginUser(email.trim(), password);
  if (!result) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  res.json(result);
});

export default router;