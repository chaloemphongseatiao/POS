import { redirect } from "next/navigation";

/** The reports menu folded into the accounting page — keep old links working. */
export default function ReportsRedirect() {
  redirect("/ledger");
}
