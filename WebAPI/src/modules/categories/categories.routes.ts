import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { list, create, update, remove } from "./categories.controller";

const router = Router();

router.use(authenticate);
router.get("/", list);
router.post("/", requireRole("ADMIN"), create);
router.put("/:id", requireRole("ADMIN"), update);
router.delete("/:id", requireRole("ADMIN"), remove);

export default router;
