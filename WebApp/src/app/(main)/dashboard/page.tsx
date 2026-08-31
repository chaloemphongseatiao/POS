import { redirect } from "next/navigation";

/** The dashboard is now the "ภาพรวม" tab of the accounting page; the till is the landing screen. */
export default function DashboardRedirect() {
  redirect("/pos");
}
