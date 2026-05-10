import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

/**
 * Catch-all auth route — handles the OAuth flow redirects from Shopify.
 * The `authenticate.admin` call manages the entire OAuth dance automatically.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};
