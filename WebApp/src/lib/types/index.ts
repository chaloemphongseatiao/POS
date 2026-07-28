export type UserRole = "ADMIN" | "CASHIER";
export type PaymentMethod = "CASH" | "QR_PROMPT_PAY";
export type OrderStatus = "COMPLETED" | "VOIDED";
export type MovementType = "STOCK_IN" | "STOCK_OUT" | "SALE" | "ADJUST";

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
  costPrice: string;
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
  product: {
    id: number;
    barcode: string | null;
    name: string;
    unit: string;
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
  product: { id: number; name: string; barcode: string | null };
  user: { displayName: string };
  order: { orderNumber: string } | null;
}

export interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: string;
  costPrice: string;
  subtotal: string;
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

export interface ReportSummary {
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  orderCount: number;
  from: string;
  to: string;
}

export interface DailyData {
  date: string;
  revenue: number;
  cost: number;
  orders: number;
}

export interface TopProduct {
  productId: number;
  name: string;
  unit: string;
  qty: number;
  revenue: number;
  profit: number;
}

// Cart types (client-side only)
export interface CartItem {
  productId: number;
  name: string;
  sellPrice: number;
  unit: string;
  quantity: number;
  imageUrl?: string | null;
}
