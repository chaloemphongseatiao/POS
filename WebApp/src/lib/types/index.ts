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
  reorderPoint: number;
  reorderQty: number;
  expiryDate: string | null;
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
    reorderPoint: number;
    reorderQty: number;
    expiryDate: string | null;
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
  product?: { id: number; name: string; barcode: string | null; unit: string };
  user: { displayName: string };
  order: { orderNumber: string } | null;
}

export interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: string;
  /** Owner-only — the API omits it for CASHIER accounts. */
  costPrice?: string;
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
  /** What the bill actually brought in, after refunded lines are taken back out. Visible to every role. */
  netRevenue: number;
  /** Owner-only — the API omits it for CASHIER accounts. */
  cost?: OrderCost;
}

/** Cost and profit for one bill, with refunded lines already taken back out. */
export interface OrderCost {
  netRevenue: number;
  cost: number;
  profit: number;
  /** Profit as a percentage of the selling price. */
  margin: number;
  /** Profit as a percentage of what the goods cost. */
  markup: number;
}

/** Totals for every bill in the selected date range, not just the page shown. */
export interface OrdersSummary {
  /** Every bill in the range, voided ones included. */
  orderCount: number;
  /** Bills that actually sold something — a voided bill never happened. */
  soldCount: number;
  revenue: number;
  /** Owner-only — the API omits these for CASHIER accounts. */
  cost?: number;
  profit?: number;
  margin?: number;
  markup?: number;
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

// Cost, profit, margin and markup are owner-only — the API omits them for CASHIER accounts.
export interface ReportSummary {
  revenue: number;
  cost?: number;
  profit?: number;
  /** Profit as a percentage of the selling price. */
  margin?: number;
  /** Profit as a percentage of what the goods cost. */
  markup?: number;
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
  cost?: number;
  profit?: number;
}

export interface SalesOverviewReport {
  grossSales: number;
  discounts: number;
  refundTotal: number;
  voidTotal: number;
  netSales: number;
  orderCount: number;
  voidCount: number;
  refundCount: number;
}

export interface CashierPerformanceReport {
  cashierId: number;
  cashier: string;
  orders: number;
  revenue: number;
  cost?: number;
  profit?: number;
  voids: number;
}

export interface LowStockReorderReport {
  productId: number;
  barcode: string | null;
  name: string;
  unit: string;
  category: string;
  quantity: number;
  lowStockAt: number;
  reorderPoint: number;
  reorderQty: number;
}

export interface ExpiryLossReport {
  productId: number;
  barcode: string | null;
  name: string;
  unit: string;
  category: string;
  expiryDate: string | null;
  quantity: number;
  costLoss?: number;
  retailLoss: number;
}

export interface ProfitByCategoryReport {
  categoryId: number;
  category: string;
  revenue: number;
  cost?: number;
  qty: number;
  profit?: number;
  margin?: number;
}

export interface PaymentBreakdownReport {
  paymentMethod: PaymentMethod;
  orders: number;
  revenue: number;
}

export interface Promotion {
  id: number;
  name: string;
  type: "PERCENT_OFF" | "AMOUNT_OFF";
  value: string;
  minQty: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  products: { product: { id: number; name: string; barcode: string | null } }[];
}

export type LedgerType = "INCOME" | "EXPENSE";

export interface LedgerCategory {
  id: number;
  name: string;
  type: LedgerType;
  isActive: boolean;
  createdAt: string;
}

export interface LedgerEntry {
  id: number;
  type: LedgerType;
  /** VAT-inclusive, like every other price in the system. */
  amount: string;
  hasVat: boolean;
  /** Rate frozen at entry time, so a later rate change cannot restate old tax. */
  vatRate: string;
  note: string | null;
  entryDate: string;
  createdAt: string;
  category: { id: number; name: string };
  user: { id: number; displayName: string };
  /** Set when the entry was posted from a recurring template. */
  recurring: { id: number; name: string } | null;
}

export type RecurringFrequency = "MONTHLY" | "WEEKLY";

export interface RecurringEntry {
  id: number;
  name: string;
  type: LedgerType;
  amount: string;
  hasVat: boolean;
  note: string | null;
  frequency: RecurringFrequency;
  /** Day of the month (1-31) when MONTHLY, day of the week (0 = Sunday) when WEEKLY. */
  dayOf: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  category: { id: number; name: string };
}

export interface RecurringDue {
  count: number;
  templates: {
    id: number;
    name: string;
    type: LedgerType;
    category: string;
    amount: number;
    dates: string[];
    total: number;
  }[];
}

/**
 * The shop's profit and loss: sales from the tills plus the manual ledger, every
 * line stated excluding VAT because tax collected on a sale is the revenue
 * department's money passing through, not income.
 */
export interface ProfitLoss {
  from: string;
  to: string;
  vat: {
    enabled: boolean;
    rate: number;
    /** Tax charged to customers. */
    outputVat: number;
    /** Tax already paid on goods and expenses, claimable back. */
    inputVat: number;
    /** Positive means the shop owes this much. */
    payable: number;
  };
  sales: {
    gross: number;
    net: number;
    vat: number;
    refundTotal: number;
    orderCount: number;
    refundCount: number;
  };
  cogs: { gross: number; net: number; vat: number };
  grossProfit: number;
  grossMargin: number;
  otherIncome: number;
  expense: number;
  netProfit: number;
  byCategory: {
    categoryId: number;
    category: string;
    type: LedgerType;
    net: number;
    vat: number;
    gross: number;
  }[];
}

export interface VatReportMonth {
  month: string;
  salesNet: number;
  outputVat: number;
  purchaseNet: number;
  inputVat: number;
  payable: number;
}

export interface VatReport {
  from: string;
  to: string;
  enabled: boolean;
  rate: number;
  taxId: string;
  months: VatReportMonth[];
  total: Omit<VatReportMonth, "month">;
}

export interface LedgerSummary {
  income: number;
  expense: number;
  net: number;
  byCategory: { categoryId: number; category: string; type: LedgerType; total: number }[];
  from: string;
  to: string;
}

// Cart types (client-side only)
export interface CartItem {
  productId: number;
  name: string;
  sellPrice: number;
  /** Only present for owners — the API withholds cost prices from cashiers. */
  costPrice?: number;
  unit: string;
  quantity: number;
  /** Quantity on hand when the item was added — the cart can't go past it. */
  stock: number;
  imageUrl?: string | null;
}
