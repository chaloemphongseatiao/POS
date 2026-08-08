import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { categorySchema } from "./categories.schema";
import { list, create, update, remove } from "./categories.controller";

const router = Router();

router.use(authenticate);
router.get("/", list);
router.post("/", requireRole("ADMIN"), validateBody(categorySchema), create);
router.put("/:id", requireRole("ADMIN"), validateBody(categorySchema), update);
router.delete("/:id", requireRole("ADMIN"), remove);

export default router;
