import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { ledgerCategorySchema, ledgerEntrySchema } from "./ledger.schema";
import * as ctrl from "./ledger.controller";

const router = Router();

// Financial data — the whole module is owner-only, same as cost/profit elsewhere.
router.use(authenticate, requireRole("ADMIN"));

router.get("/categories", ctrl.listCategories);
router.post("/categories", validateBody(ledgerCategorySchema), ctrl.createCategory);
router.put("/categories/:id", validateBody(ledgerCategorySchema), ctrl.updateCategory);
router.delete("/categories/:id", ctrl.deleteCategory);

router.get("/entries", ctrl.listEntries);
router.post("/entries", validateBody(ledgerEntrySchema), ctrl.createEntry);
router.put("/entries/:id", validateBody(ledgerEntrySchema), ctrl.updateEntry);
router.delete("/entries/:id", ctrl.deleteEntry);

router.get("/summary", ctrl.summary);

export default router;
