import { OrderStatus } from "@/lib/types";

type BadgeVariant = "success" | "destructive" | "warning" | "secondary";

const LABELS: Record<OrderStatus, { label: string; short: string; variant: BadgeVariant }> = {
  COMPLETED: { label: "สำเร็จ", short: "สำเร็จ", variant: "success" },
  VOIDED: { label: "ยกเลิกแล้ว", short: "ยกเลิก", variant: "destructive" },
  PARTIAL_REFUND: { label: "คืนบางส่วน", short: "คืนบางส่วน", variant: "warning" },
  REFUNDED: { label: "คืนทั้งบิล", short: "คืนแล้ว", variant: "secondary" },
};

const UNKNOWN = { label: "ไม่ทราบสถานะ", short: "-", variant: "secondary" as BadgeVariant };

export function orderStatusInfo(status: OrderStatus) {
  return LABELS[status] ?? UNKNOWN;
}

/** A bill still has money on it unless it was voided or fully returned. */
export function countsAsSale(status: OrderStatus): boolean {
  return status !== "VOIDED";
}
