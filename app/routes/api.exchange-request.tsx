import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { supabase } from "../utils/supabase.client";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = await request.json();
  const {
    orderId,
    orderName,
    customerEmail,
    originalProductTitle,
    originalVariantId,
    newProductId,
    newVariantId,
    newProductTitle,
    newVariantTitle
  } = body;

  const { data, error } = await supabase
    .from('exchange_requests')
    .insert({
      shopify_order_id: orderId,
      original_order_name: orderName,
      customer_email: customerEmail,
      original_product_title: originalProductTitle,
      original_variant_id: originalVariantId,
      new_product_id: newProductId,
      new_variant_id: newVariantId,
      new_product_title: newProductTitle,
      new_variant_title: newVariantTitle,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return json({ error: "Failed to submit exchange request" }, { status: 500 });
  }

  return json({ success: true, request: data });
};
