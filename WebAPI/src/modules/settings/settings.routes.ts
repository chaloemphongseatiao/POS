import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { get, getPublic, upsert, lineTest, lineDiagnose, backup } from "./settings.controller";

const router = Router();

router.get("/public", getPublic);

router.use(authenticate);
// Returns every stored setting, LINE channel token and secret included — admin only.
router.get("/", requireRole("ADMIN"), get);
router.post("/", requireRole("ADMIN"), upsert);
router.get("/backup", requireRole("ADMIN"), backup);
router.post("/line-test", requireRole("ADMIN"), lineTest);
router.get("/line-diagnose", requireRole("ADMIN"), lineDiagnose);

export default router;
