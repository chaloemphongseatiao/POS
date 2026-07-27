import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { list, getById, getByBarcode, create, update, hardDelete } from "./products.controller";

const router = Router();

router.use(authenticate);
router.get("/", list);
router.get("/barcode/:barcode", getByBarcode);
router.get("/:id", getById);
router.post("/", requireRole("ADMIN"), create);
router.put("/:id", requireRole("ADMIN"), update);
router.delete("/:id", requireRole("ADMIN"), hardDelete);

export default router;
