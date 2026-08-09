import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { closeShiftSchema, openShiftSchema } from "./shifts.schema";
import { current, open, close, list, getOne } from "./shifts.controller";

const router = Router();

router.use(authenticate);
// Cashiers open and close their own drawer, so these are not admin-only.
router.get("/current", current);
router.post("/open", validateBody(openShiftSchema), open);
router.post("/close", validateBody(closeShiftSchema), close);
router.get("/", list);
router.get("/:id", getOne);

export default router;
