import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { createRefundSchema } from "./refunds.schema";
import { list, byOrder, create } from "./refunds.controller";

const router = Router();

router.use(authenticate);
router.get("/", list);
router.get("/order/:orderId", byOrder);
// Giving money back is admin-only, the same gate as voiding a bill.
router.post("/", requireRole("ADMIN"), validateBody(createRefundSchema), create);

export default router;
