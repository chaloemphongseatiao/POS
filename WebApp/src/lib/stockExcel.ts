import * as XLSX from "xlsx";
import { StockItem } from "@/lib/types";
import { StockImportRow } from "@/lib/api/stock";

// "คงเหลือ" is the round-trip column: export it, edit it, import it back as a
// stocktake. The rest are there to identify the row while editing.
const HEADERS = ["Barcode", "ชื่อสินค้า", "หมวดหมู่", "หน่วย", "คงเหลือ", "จุดแจ้งเตือน"] as const;

type ExcelRow = Record<string, string | number | undefined>;

export function exportStockExcel(stocks: StockItem[]) {
  const rows: ExcelRow[] = stocks.map((stock) => ({
    Barcode: stock.product.barcode ?? "",
    "ชื่อสินค้า": stock.product.name,
    "หมวดหมู่": stock.product.category.name,
    "หน่วย": stock.product.unit,
    "คงเหลือ": stock.quantity,
    "จุดแจ้งเตือน": stock.product.lowStockAt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...HEADERS] });
  worksheet["!cols"] = [16, 28, 20, 10, 12, 14].map((wch) => ({ wch }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "สต็อก");
  XLSX.writeFile(workbook, `stock-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function numberValue(value: unknown) {
  if (value === "" || value === null || value === undefined) return Number.NaN;
  return typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
}

export async function readStockExcel(file: File): Promise<StockImportRow[]> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!worksheet) throw new Error("ไม่พบ worksheet ในไฟล์");
  const rawRows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { defval: "" });

  return rawRows
    .map((item, index) => ({
      // Numbered before blank rows are dropped, so the error message points at
      // the row the user actually sees in Excel (+1 header, +1 one-based).
      row: index + 2,
      barcode: String(item.Barcode ?? "").trim() || undefined,
      name: String(item["ชื่อสินค้า"] ?? "").trim() || undefined,
      quantity: numberValue(item["คงเหลือ"]),
    }))
    .filter((row) => row.barcode || row.name || Number.isFinite(row.quantity));
}
