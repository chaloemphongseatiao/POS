import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { createOrderSchema } from "./orders.schema";
import { list, getOne, create, voidOrder } from "./orders.controller";

const router = Router();

router.use(authenticate);
router.get("/", list);
router.get("/:id", getOne);
router.post("/", validateBody(createOrderSchema), create);
router.patch("/:id/void", requireRole("ADMIN"), voidOrder);

export default router;
