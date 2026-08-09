export type UserRole = "ADMIN" | "CASHIER";
export type PaymentMethod = "CASH" | "QR_PROMPT_PAY";
export type OrderStatus = "COMPLETED" | "VOIDED" | "PARTIAL_REFUND" | "REFUNDED";
export type MovementType = "STOCK_IN" | "STOCK_OUT" | "SALE" | "ADJUST" | "RETURN";

export interface User {
  id: number;
  username: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  createdAt: string;
}

export interface LineFollower {
  id: number;
  lineUserId: string;
  displayName: string | null;
  isActive: boolean;
  followedAt: string;
  unfollowedAt: string | null;
}

export interface StockInfo {
  quantity: number;
}

export interface Product {
  id: number;
  barcode: string | null;
  name: string;
  description: string | null;
  /** Owner-only — the API omits it for CASHIER accounts. */
  costPrice?: string;
  sellPrice: string;
  unit: string;
  imageUrl: string | null;
  isActive: boolean;
  lowStockAt: number;
  createdAt: string;
  category: { id: number; name: string };
  stock: StockInfo | null;
}

export interface StockItem {
  id: number;
  quantity: number;
  updatedAt: string;
  /** Lifetime movement quantities, split by sign — ADJUST counts on both sides. */
  totalIn: number;
  totalOut: number;
  product: {
    id: number;
    barcode: string | null;
    name: string;
    unit: string;
    costPrice: string;
    sellPrice: string;
    lowStockAt: number;
    isActive: boolean;
    imageUrl: string | null;
    category: { id: number; name: string };
  };
}

export interface StockMovement {
  id: number;
  type: MovementType;
  quantity: number;
  note: string | null;
  createdAt: string;
  /** Omitted by the per-product movements endpoint, which already knows it. */
  product?: { id: number; name: string; barcode: string | null };
  user: { displayName: string };
  order: { orderNumber: string } | null;
}

export interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: string;
  costPrice: string;
  subtotal: string;
  /** How many of `quantity` have already been given back. */
  refundedQty: number;
  product: { id: number; name: string; barcode: string | null; unit: string };
}

export interface Order {
  id: number;
  orderNumber: string;
  subtotal: string;
  discountAmt: string;
  totalAmt: string;
  paymentMethod: PaymentMethod;
  amountPaid: string;
  changeAmt: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
  cashier: { displayName: string };
  items: OrderItem[];
}

export interface RefundItem {
  id: number;
  quantity: number;
  unitPrice: string;
  costPrice: string;
  subtotal: string;
  product: { name: string; unit: string };
}

export interface Refund {
  id: number;
  refundNumber: string;
  totalAmt: string;
  totalCost: string;
  reason: string | null;
  restock: boolean;
  createdAt: string;
  orderId: number;
  user: { displayName: string };
  order?: { orderNumber: string; paymentMethod: PaymentMethod };
  items: RefundItem[];
}

export interface ShiftTotals {
  orderCount: number;
  salesTotal: number;
  cashSales: number;
  qrSales: number;
  refundTotal: number;
  cashRefunds: number;
  qrRefunds: number;
  voidedCount: number;
  expectedCash: number;
}

export interface Shift {
  id: number;
  openingCash: string;
  closingCash: string | null;
  expectedCash: string | null;
  /** closingCash - expectedCash: negative means the drawer came up short. */
  diffCash: string | null;
  note: string | null;
  openedAt: string;
  closedAt: string | null;
  openedBy: { id: number; displayName: string };
  closedBy: { id: number; displayName: string } | null;
  totals: ShiftTotals;
}

// Cost, profit and margin are owner-only — the API omits them for CASHIER accounts.
export interface ReportSummary {
  revenue: number;
  cost?: number;
  profit?: number;
  margin?: number;
  orderCount: number;
  refundTotal?: number;
  refundCount?: number;
  from: string;
  to: string;
}

export interface DailyData {
  date: string;
  revenue: number;
  cost?: number;
  orders: number;
  refunds?: number;
}

export interface TopProduct {
  productId: number;
  name: string;
  unit: string;
  qty: number;
  revenue: number;
  profit?: number;
}

// Cart types (client-side only)
export interface CartItem {
  productId: number;
  name: string;
  sellPrice: number;
  unit: string;
  quantity: number;
  /** Quantity on hand when the item was added — the cart can't go past it. */
  stock: number;
  imageUrl?: string | null;
}
