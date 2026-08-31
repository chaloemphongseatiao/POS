/**
 * The shop quotes VAT-inclusive prices: the shelf price is what the customer
 * pays, so tax is always backed out of a gross amount and never added on top.
 * Mirrors `WebAPI/src/lib/vat.ts` so a receipt printed from the browser and the
 * VAT report generated on the server can never disagree about the same sale.
 */

export const DEFAULT_VAT_RATE = 7;

export interface VatSettings {
  enabled: boolean;
  /** Percent, e.g. 7. Always 0 when disabled, so callers need no second check. */
  rate: number;
  taxId: string;
}

export interface VatSplit {
  net: number;
  vat: number;
  gross: number;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function splitVat(gross: number | string, rate: number): VatSplit {
  const amount = round2(typeof gross === "string" ? parseFloat(gross) : gross);
  if (!Number.isFinite(amount)) return { net: 0, vat: 0, gross: 0 };
  if (!(rate > 0)) return { net: amount, vat: 0, gross: amount };
  const net = round2(amount / (1 + rate / 100));
  return { net, vat: round2(amount - net), gross: amount };
}

/** Reads the VAT block out of the generic key-value settings map. */
export function readVatSettings(settings: Record<string, string> | undefined): VatSettings {
  const enabled = settings?.vat_enabled === "true";
  const parsed = Number(settings?.vat_rate);
  return {
    enabled,
    rate: enabled ? (Number.isFinite(parsed) && parsed >= 0 && parsed < 100 ? parsed : DEFAULT_VAT_RATE) : 0,
    taxId: settings?.tax_id ?? "",
  };
}
