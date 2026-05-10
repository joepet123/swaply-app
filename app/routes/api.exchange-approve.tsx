import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { supabase } from "../utils/supabase.client";
import { createExchangeDraftOrder, getOriginalOrderDetails } from "../utils/shopify.server";
import { generateReturnLabel } from "../utils/shipengine.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = formData.get("id");

  if (!id) return json({ error: "Missing ID" }, { status: 400 });

  if (intent === "approve") {
    // 1. Fetch exchange request from Supabase
    const { data: exchangeRequest, error: fetchError } = await supabase
      .from('exchange_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !exchangeRequest) {
      return json({ error: "Request not found" }, { status: 404 });
    }

    // 2. Fetch original order details from Shopify
    const originalOrder = await getOriginalOrderDetails(admin, exchangeRequest.shopify_order_id);
    if (!originalOrder) {
      return json({ error: "Original order not found in Shopify" }, { status: 404 });
    }

    // 3. Create Draft Order in Shopify
    const draftOrderResult = await createExchangeDraftOrder(admin, exchangeRequest, originalOrder);
    if (draftOrderResult?.userErrors?.length > 0) {
      return json({ error: draftOrderResult.userErrors[0].message }, { status: 400 });
    }

    const draftOrderId = draftOrderResult?.draftOrder?.id;

    // 4. Generate Return Label via ShipEngine
    const customerAddress = originalOrder.shippingAddress || originalOrder.billingAddress;
    const labelUrl = await generateReturnLabel(customerAddress);

    // 5. Update Supabase
    const { error: updateError } = await supabase
      .from('exchange_requests')
      .update({ 
        status: 'approved', 
        approved_at: new Date().toISOString(),
        draft_order_id: draftOrderId,
        return_label_url: labelUrl
      })
      .eq('id', id);

    if (updateError) {
      return json({ error: "Failed to update status in database" }, { status: 500 });
    }

    return json({ success: true });
  }

  if (intent === "reject") {
    const { error } = await supabase
      .from('exchange_requests')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) return json({ error: "Failed to update status" }, { status: 500 });
    return json({ success: true });
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};
