import { AdminApiContext } from "@shopify/shopify-app-remix/server";

/**
 * Creates a draft order for the exchange item.
 */
export async function createExchangeDraftOrder(
  admin: AdminApiContext,
  exchangeRequest: any,
  originalOrder: any
) {
  const shippingAddr = originalOrder.shippingAddress || originalOrder.billingAddress;

  const response = await admin.graphql(
    `#graphql
    mutation DraftOrderCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder {
          id
          name
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      variables: {
        input: {
          lineItems: [
            {
              variantId: exchangeRequest.new_variant_id,
              quantity: 1,
              appliedDiscount: {
                value: 100,
                valueType: "PERCENTAGE",
                title: "Exchange - Full Discount",
              },
            },
          ],
          ...(shippingAddr && {
            shippingAddress: {
              firstName: shippingAddr.firstName,
              lastName: shippingAddr.lastName,
              address1: shippingAddr.address1,
              address2: shippingAddr.address2,
              city: shippingAddr.city,
              province: shippingAddr.province,
              country: shippingAddr.country,
              zip: shippingAddr.zip,
              phone: shippingAddr.phone,
              company: shippingAddr.company,
            },
          }),
          note: `EXCHANGE - Original Order ${exchangeRequest.original_order_name}`,
          tags: [`exchange`, `original-order-${exchangeRequest.original_order_name}`],
          email: exchangeRequest.customer_email,
        },
      },
    }
  );

  const data = await response.json();
  return data.data?.draftOrderCreate;
}

/**
 * Fetches original order details.
 */
export async function getOriginalOrderDetails(admin: AdminApiContext, orderId: string) {
  const response = await admin.graphql(
    `#graphql
    query GetOrder($id: ID!) {
      order(id: $id) {
        name
        email
        billingAddress {
          firstName lastName company address1 address2
          city province country zip phone
        }
        shippingAddress {
          firstName lastName company address1 address2
          city province country zip phone
        }
      }
    }`,
    { variables: { id: orderId } }
  );

  const data = await response.json();
  return data.data?.order;
}
