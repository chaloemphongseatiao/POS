import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { summary, daily, topProducts, hourly } from "./reports.controller";

const router = Router();

router.use(authenticate);
router.get("/summary", summary);
router.get("/daily", daily);
router.get("/top-products", topProducts);
router.get("/hourly", hourly);

export default router;
