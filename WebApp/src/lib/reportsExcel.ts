import * as XLSX from "xlsx";
import { DailyData, ReportSummary, TopProduct } from "@/lib/types";

type ExcelRow = Record<string, string | number>;

function sheet(rows: ExcelRow[], widths: number[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = widths.map((wch) => ({ wch }));
  return worksheet;
}

/** One workbook per report range: summary, day-by-day, and the product ranking. */
export function exportReportExcel(params: {
  summary: ReportSummary;
  daily: DailyData[];
  topProducts: TopProduct[];
  from: string;
  to: string;
}) {
  const { summary, daily, topProducts, from, to } = params;

  const summaryRows: ExcelRow[] = [
    { "รายการ": "ช่วงวันที่", "ค่า": `${from} ถึง ${to}` },
    { "รายการ": "ยอดขายสุทธิ", "ค่า": summary.revenue },
    { "รายการ": "ยอดคืนสินค้า", "ค่า": summary.refundTotal ?? 0 },
    { "รายการ": "จำนวนบิล", "ค่า": summary.orderCount },
    ...(summary.cost !== undefined ? [{ "รายการ": "ต้นทุน", "ค่า": summary.cost }] : []),
    ...(summary.profit !== undefined ? [{ "รายการ": "กำไร", "ค่า": summary.profit }] : []),
    ...(summary.margin !== undefined
      ? [{ "รายการ": "อัตรากำไร (%)", "ค่า": Number(summary.margin.toFixed(2)) }]
      : []),
  ];

  const dailyRows: ExcelRow[] = daily.map((day) => ({
    "วันที่": day.date,
    "ยอดขาย": day.revenue,
    "ยอดคืน": day.refunds ?? 0,
    "จำนวนบิล": day.orders,
    ...(day.cost !== undefined ? { "ต้นทุน": day.cost, "กำไร": day.revenue - day.cost } : {}),
  }));

  const productRows: ExcelRow[] = topProducts.map((product, index) => ({
    "อันดับ": index + 1,
    "สินค้า": product.name,
    "จำนวนขาย": product.qty,
    "หน่วย": product.unit,
    "ยอดขาย": product.revenue,
    ...(product.profit !== undefined ? { "กำไร": product.profit } : {}),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet(summaryRows, [24, 22]), "สรุป");
  XLSX.utils.book_append_sheet(workbook, sheet(dailyRows, [14, 14, 14, 12, 14, 14]), "รายวัน");
  XLSX.utils.book_append_sheet(workbook, sheet(productRows, [8, 30, 12, 10, 14, 14]), "สินค้าขายดี");
  XLSX.writeFile(workbook, `report-${from}_${to}.xlsx`);
}
