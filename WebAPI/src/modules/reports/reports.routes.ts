import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import {
  summary,
  daily,
  topProducts,
  hourly,
  salesOverview,
  refundVoid,
  cashierPerformance,
  lowStockReorder,
  expiryLoss,
  profitByCategory,
  paymentBreakdown,
} from "./reports.controller";

const router = Router();

router.use(authenticate);
router.get("/summary", summary);
router.get("/daily", daily);
router.get("/top-products", topProducts);
router.get("/hourly", hourly);
router.get("/sales-overview", salesOverview);
router.get("/refund-void", refundVoid);
router.get("/cashier-performance", cashierPerformance);
router.get("/low-stock-reorder", lowStockReorder);
router.get("/expiry-loss", expiryLoss);
router.get("/profit-by-category", profitByCategory);
router.get("/payment-breakdown", paymentBreakdown);

export default router;
