import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { list, create, update, toggle } from "./users.controller";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));
router.get("/", list);
router.post("/", create);
router.put("/:id", update);
router.patch("/:id/toggle", toggle);

export default router;
