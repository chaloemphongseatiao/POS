import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { loginRateLimit } from "../../middleware/rateLimit";
import { loginSchema, changePasswordSchema } from "./auth.schema";
import { loginHandler, getMeHandler, changePasswordHandler } from "./auth.controller";

const router = Router();

router.post("/login", loginRateLimit, validateBody(loginSchema), loginHandler);
router.get("/me", authenticate, getMeHandler);
router.put("/change-password", authenticate, validateBody(changePasswordSchema), changePasswordHandler);

export default router;
