/**
 * Generates a return label using ShipEngine API.
 */
export async function generateReturnLabel(
  customerAddress: any,
  merchantAddress?: any
): Promise<string | undefined> {
  const apiKey = process.env.SHIPENGINE_API_KEY;
  if (!apiKey || apiKey === "xxx") return undefined;

  // Placeholder merchant address if not provided
  const shipFrom = merchantAddress || {
    name: "Merchant Return Center",
    phone: "555-555-5555",
    address_line1: "123 Merchant St",
    city: "Austin",
    state_province: "TX",
    postal_code: "78701",
    country_code: "US",
  };

  try {
    const response = await fetch("https://api.shipengine.com/v1/labels", {
      method: "POST",
      headers: {
        "API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shipment: {
          service_code: "usps_first",
          ship_from: shipFrom,
          ship_to: {
            name: `${customerAddress.firstName} ${customerAddress.lastName}`,
            phone: customerAddress.phone || "555-555-5555",
            address_line1: customerAddress.address1,
            address_line2: customerAddress.address2 || "",
            city: customerAddress.city,
            state_province: customerAddress.province_code || customerAddress.province,
            postal_code: customerAddress.zip,
            country_code: customerAddress.country_code || "US",
          },
        },
      }),
    });

    const data: any = await response.json();

    if (data.errors && data.errors.length > 0) {
      console.error("ShipEngine Error:", data.errors);
      return undefined;
    }

    return data.label_download?.href;
  } catch (error) {
    console.error("Failed to call ShipEngine API:", error);
    return undefined;
  }
}
