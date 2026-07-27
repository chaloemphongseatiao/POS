import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { list, getOne, create, voidOrder } from "./orders.controller";

const router = Router();

router.use(authenticate);
router.get("/", list);
router.get("/:id", getOne);
router.post("/", create);
router.patch("/:id/void", requireRole("ADMIN"), voidOrder);

export default router;
