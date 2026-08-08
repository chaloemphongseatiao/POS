import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { stockInSchema, adjustStockSchema, receiveStockSchema } from "./stock.schema";
import { list, lowStock, movements, allMovements, stockIn, adjust, receive, importMany } from "./stock.controller";

const router = Router();

router.use(authenticate);
router.get("/", list);
router.get("/low", lowStock);
router.get("/movements", allMovements);
router.get("/:productId/movements", movements);
router.post("/import", requireRole("ADMIN"), importMany);
router.post("/receive", requireRole("ADMIN"), validateBody(receiveStockSchema), receive);
router.post("/:productId/in", requireRole("ADMIN"), validateBody(stockInSchema), stockIn);
router.post("/:productId/adjust", requireRole("ADMIN"), validateBody(adjustStockSchema), adjust);

export default router;
