import { MovementType } from "@/lib/types";

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  STOCK_IN: "รับเข้า",
  STOCK_OUT: "จ่ายออก",
  SALE: "ขาย",
  ADJUST: "ปรับยอด",
  RETURN: "คืนสินค้า",
};

export function movementTypeLabel(type: MovementType): string {
  return MOVEMENT_TYPE_LABELS[type] ?? type;
}
