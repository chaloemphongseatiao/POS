import * as XLSX from "xlsx";
import { StockItem, StockMovement } from "@/lib/types";
import { movementTypeLabel } from "@/lib/utils/movements";

type ExcelRow = Record<string, string | number>;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function save(rows: ExcelRow[], headers: string[], widths: number[], sheet: string, file: string) {
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
  worksheet["!cols"] = widths.map((wch) => ({ wch }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheet);
  XLSX.writeFile(workbook, file);
}

/** Timestamps are shown in the browser's locale, the same as on screen. */
function timestamp(value: string): string {
  return new Date(value).toLocaleString("th-TH");
}

export function exportMovementsExcel(
  movements: StockMovement[],
  sheetName: string,
  fileName: string
) {
  const headers = [
    "วันที่",
    "Barcode",
    "สินค้า",
    "ประเภท",
    "รับเข้า",
    "จ่ายออก",
    "อ้างอิง",
    "หมายเหตุ",
    "ผู้ทำรายการ",
  ];

  const rows: ExcelRow[] = movements.map((movement) => ({
    "วันที่": timestamp(movement.createdAt),
    Barcode: movement.product?.barcode ?? "",
    "สินค้า": movement.product?.name ?? "",
    "ประเภท": movementTypeLabel(movement.type),
    "รับเข้า": movement.quantity > 0 ? movement.quantity : 0,
    "จ่ายออก": movement.quantity < 0 ? -movement.quantity : 0,
    "อ้างอิง": movement.order?.orderNumber ?? "",
    "หมายเหตุ": movement.note ?? "",
    "ผู้ทำรายการ": movement.user?.displayName ?? "",
  }));

  save(rows, headers, [20, 16, 28, 12, 10, 10, 18, 30, 18], sheetName, fileName);
}

export function exportStockOnHandExcel(stocks: StockItem[], fileName: string) {
  const headers = [
    "Barcode",
    "สินค้า",
    "หมวดหมู่",
    "หน่วย",
    "คงเหลือ",
    "จุดแจ้งเตือน",
    "ต้นทุน/หน่วย",
    "มูลค่าต้นทุน",
  ];

  const rows: ExcelRow[] = stocks.map((stock) => {
    const cost = Number(stock.product.costPrice);
    return {
      Barcode: stock.product.barcode ?? "",
      "สินค้า": stock.product.name,
      "หมวดหมู่": stock.product.category.name,
      "หน่วย": stock.product.unit,
      "คงเหลือ": stock.quantity,
      "จุดแจ้งเตือน": stock.product.lowStockAt,
      "ต้นทุน/หน่วย": cost,
      "มูลค่าต้นทุน": round2(cost * stock.quantity),
    };
  });

  save(rows, headers, [16, 28, 20, 10, 12, 14, 14, 16], "สต็อกคงเหลือ", fileName);
}
