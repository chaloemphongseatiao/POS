import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { createProductSchema, updateProductSchema } from "./products.schema";
import { list, getById, getByBarcode, getImage, uploadImage, create, update, importMany, hardDelete } from "./products.controller";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

const router = Router();

router.get("/:id/image", getImage);
router.use(authenticate);
router.get("/", list);
router.get("/barcode/:barcode", getByBarcode);
router.post("/import", requireRole("ADMIN"), importMany);
router.post("/upload-image", requireRole("ADMIN"), upload.single("image"), uploadImage);
router.get("/:id", getById);
router.post("/", requireRole("ADMIN"), validateBody(createProductSchema), create);
router.put("/:id", requireRole("ADMIN"), validateBody(updateProductSchema), update);
router.delete("/:id", requireRole("ADMIN"), hardDelete);

export default router;
