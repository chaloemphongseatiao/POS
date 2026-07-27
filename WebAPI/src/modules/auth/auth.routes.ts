import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { loginHandler, getMeHandler, changePasswordHandler } from "./auth.controller";

const router = Router();

router.post("/login", loginHandler);
router.get("/me", authenticate, getMeHandler);
router.put("/change-password", authenticate, changePasswordHandler);

export default router;
