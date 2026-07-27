import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { list, lowStock, movements, allMovements, stockIn, adjust } from "./stock.controller";

const router = Router();

router.use(authenticate);
router.get("/", list);
router.get("/low", lowStock);
router.get("/movements", allMovements);
router.get("/:productId/movements", movements);
router.post("/:productId/in", requireRole("ADMIN"), stockIn);
router.post("/:productId/adjust", requireRole("ADMIN"), adjust);

export default router;
