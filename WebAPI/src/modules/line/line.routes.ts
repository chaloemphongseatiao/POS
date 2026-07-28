import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { webhook, followers } from "./line.controller";

const router = Router();

router.post("/webhook", webhook);

router.use(authenticate);
router.get("/followers", requireRole("ADMIN"), followers);

export default router;
