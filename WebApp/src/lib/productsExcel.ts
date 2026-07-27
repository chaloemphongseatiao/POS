import * as XLSX from "xlsx";
import { Product } from "@/lib/types";
import { ProductImportRow } from "@/lib/api/products";

const HEADERS = [
  "Barcode",
  "ชื่อสินค้า",
  "หมวดหมู่",
  "ราคาทุน",
  "ราคาขาย",
  "หน่วย",
  "Stock",
  "จุดแจ้งเตือน",
  "สถานะ",
  "คำอธิบาย",
  "URL รูปภาพ",
] as const;

type ExcelRow = Record<string, string | number | boolean | undefined>;

export function exportProductsExcel(products: Product[]) {
  const rows: ExcelRow[] = products.map((product) => ({
    Barcode: product.barcode ?? "",
    "ชื่อสินค้า": product.name,
    "หมวดหมู่": product.category.name,
    "ราคาทุน": Number(product.costPrice),
    "ราคาขาย": Number(product.sellPrice),
    "หน่วย": product.unit,
    Stock: product.stock?.quantity ?? 0,
    "จุดแจ้งเตือน": product.lowStockAt,
    "สถานะ": product.isActive ? "ใช้งาน" : "ปิดใช้งาน",
    "คำอธิบาย": product.description ?? "",
    "URL รูปภาพ": product.imageUrl ?? "",
  }));
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...HEADERS] });
  worksheet["!cols"] = [16, 28, 20, 12, 12, 10, 10, 14, 14, 32, 40].map((wch) => ({ wch }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "สินค้า");
  XLSX.writeFile(workbook, `products-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function numberValue(value: unknown, fallback = Number.NaN) {
  if (value === "" || value === null || value === undefined) return fallback;
  return typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
}

export async function readProductsExcel(file: File): Promise<ProductImportRow[]> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!worksheet) throw new Error("ไม่พบ worksheet ในไฟล์");
  const rawRows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { defval: "" });

  return rawRows
    .filter((item) => Object.values(item).some((value) => String(value).trim() !== ""))
    .map((item, index) => {
      const status = String(item["สถานะ"] ?? "ใช้งาน").trim().toLocaleLowerCase();
      return {
        row: index + 2,
        barcode: String(item.Barcode ?? "").trim() || undefined,
        name: String(item["ชื่อสินค้า"] ?? "").trim(),
        category: String(item["หมวดหมู่"] ?? "").trim(),
        costPrice: numberValue(item["ราคาทุน"], 0),
        sellPrice: numberValue(item["ราคาขาย"]),
        unit: String(item["หน่วย"] ?? "ชิ้น").trim() || "ชิ้น",
        stock: numberValue(item.Stock, 0),
        lowStockAt: numberValue(item["จุดแจ้งเตือน"], 5),
        isActive: !["ปิดใช้งาน", "inactive", "false", "0"].includes(status),
        description: String(item["คำอธิบาย"] ?? "").trim() || undefined,
        imageUrl: String(item["URL รูปภาพ"] ?? "").trim() || undefined,
      };
    });
}
