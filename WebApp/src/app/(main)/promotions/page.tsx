import { redirect } from "next/navigation";

/** Promotions moved under products, where the products they discount live. */
export default function PromotionsRedirect() {
  redirect("/products/promotions");
}
