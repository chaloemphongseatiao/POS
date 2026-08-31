import { prisma } from "./prisma";
import { round2 } from "./profit";

/**
 * The shop quotes VAT-inclusive prices: the number on the shelf, on the label
 * and in `Product.sellPrice` is what the customer actually hands over. Tax is
 * therefore always *backed out* of a gross figure, never added on top — adding
 * 7% to a shelf price would overcharge every bill. Every VAT figure in the
 * system comes from here so the receipt, the P&L and the VAT report can never
 * disagree about the same sale.
 */

export const DEFAULT_VAT_RATE = 7;

export type VatConfig = {
  enabled: boolean;
  /** Percent, e.g. 7. Always 0 when `enabled` is false, so callers need no second check. */
  rate: number;
  /**
   * Whether `Product.costPrice` and VAT-flagged expenses were bought with a tax
   * invoice, making their embedded tax claimable as input VAT.
   */
  costInclusive: boolean;
  taxId: string;
};

export type VatSplit = {
  /** The amount excluding tax — the figure the P&L is built on. */
  net: number;
  /** The tax embedded in the gross amount. */
  vat: number;
  /** What was actually charged: net + vat. */
  gross: number;
};

/**
 * Backs the tax out of a VAT-inclusive amount. A zero (or disabled) rate makes
 * this the identity, which is what keeps a non-VAT shop on the same code path
 * instead of needing a parallel set of untaxed reports.
 */
export function splitVat(gross: number, rate: number): VatSplit {
  const rounded = round2(gross);
  if (!(rate > 0)) return { net: rounded, vat: 0, gross: rounded };
  const net = round2(rounded / (1 + rate / 100));
  return { net, vat: round2(rounded - net), gross: rounded };
}

function parseRate(raw: string | undefined): number {
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 && value < 100 ? value : DEFAULT_VAT_RATE;
}

/** Reads the shop's VAT setup out of the generic `Setting` store. */
export async function getVatConfig(): Promise<VatConfig> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["vat_enabled", "vat_rate", "vat_cost_inclusive", "tax_id"] } },
  });
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  const enabled = map.vat_enabled === "true";
  return {
    enabled,
    rate: enabled ? parseRate(map.vat_rate) : 0,
    costInclusive: enabled && map.vat_cost_inclusive === "true",
    taxId: map.tax_id ?? "",
  };
}
