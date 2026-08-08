import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { get, getPublic, upsert, lineTest, lineDiagnose } from "./settings.controller";

const router = Router();

router.get("/public", getPublic);

router.use(authenticate);
router.get("/", get);
router.post("/", requireRole("ADMIN"), upsert);
router.post("/line-test", requireRole("ADMIN"), lineTest);
router.get("/line-diagnose", requireRole("ADMIN"), lineDiagnose);

export default router;
