import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { ledgerCategorySchema, ledgerEntrySchema, recurringEntrySchema } from "./ledger.schema";
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

// Recurring templates must be mounted before nothing else claims /recurring/:id.
router.get("/recurring", ctrl.listRecurring);
router.get("/recurring/due", ctrl.recurringDue);
router.post("/recurring/run", ctrl.runRecurring);
router.post("/recurring", validateBody(recurringEntrySchema), ctrl.createRecurring);
router.put("/recurring/:id", validateBody(recurringEntrySchema), ctrl.updateRecurring);
router.delete("/recurring/:id", ctrl.deleteRecurring);

router.get("/summary", ctrl.summary);
router.get("/profit-loss", ctrl.profitLoss);
router.get("/vat", ctrl.vatReport);

router.get("/export/entries", ctrl.exportEntries);
router.get("/export/profit-loss", ctrl.exportProfitLoss);
router.get("/export/vat", ctrl.exportVat);

export default router;
