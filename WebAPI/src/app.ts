import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import categoriesRoutes from "./modules/categories/categories.routes";
import productsRoutes from "./modules/products/products.routes";
import stockRoutes from "./modules/stock/stock.routes";
import ordersRoutes from "./modules/orders/orders.routes";
import refundsRoutes from "./modules/refunds/refunds.routes";
import reportsRoutes from "./modules/reports/reports.routes";
import settingsRoutes from "./modules/settings/settings.routes";
import lineRoutes from "./modules/line/line.routes";
import promotionsRoutes from "./modules/promotions/promotions.routes";
import ledgerRoutes from "./modules/ledger/ledger.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// Behind Vercel/any reverse proxy the socket address is the proxy's — without
// this every client would share one rate-limit bucket.
app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",")
    : true, // อนุญาตทุก origin ในโหมด dev (LAN)
}));
app.use(morgan("dev"));
// LINE webhook ต้องใช้ raw body เพื่อตรวจสอบ signature — ต้อง mount ก่อน express.json()
app.use("/api/line/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "4mb" }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/refunds", refundsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/line", lineRoutes);
app.use("/api/promotions", promotionsRoutes);
app.use("/api/ledger", ledgerRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "ไม่พบ endpoint ที่เรียก" });
});

app.use(errorHandler);

export default app;
