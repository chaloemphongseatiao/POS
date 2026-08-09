import { z } from "zod";

const money = z.number().nonnegative().max(10_000_000);
const note = z.string().trim().max(500).optional();

export const openShiftSchema = z.object({
  openingCash: money,
  note,
});

export const closeShiftSchema = z.object({
  /** Cash the cashier actually counted in the drawer. */
  closingCash: money,
  note,
});

export type OpenShiftInput = z.infer<typeof openShiftSchema>;
export type CloseShiftInput = z.infer<typeof closeShiftSchema>;
