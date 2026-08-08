import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { createUserSchema, updateUserSchema } from "./users.schema";
import { list, create, update, toggle } from "./users.controller";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));
router.get("/", list);
router.post("/", validateBody(createUserSchema), create);
router.put("/:id", validateBody(updateUserSchema), update);
router.patch("/:id/toggle", toggle);

export default router;
