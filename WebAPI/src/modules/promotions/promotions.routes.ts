import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { promotionSchema } from "./promotions.schema";
import { list, create, update, remove } from "./promotions.controller";

const router = Router();

router.use(authenticate);
router.get("/", list);
router.post("/", requireRole("ADMIN"), validateBody(promotionSchema), create);
router.put("/:id", requireRole("ADMIN"), validateBody(promotionSchema), update);
router.delete("/:id", requireRole("ADMIN"), remove);

export default router;
