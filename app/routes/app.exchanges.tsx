import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  IndexTable,
  Badge,
  Button,
  ButtonGroup,
  Text,
  BlockStack,
  InlineStack,
  EmptyState,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { supabase } from "../utils/supabase.client";
import type { ExchangeRequest } from "../utils/supabase.client";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  const { data: requests, error } = await supabase
    .from('exchange_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Supabase fetch error:", error);
    return json({ requests: [] });
  }

  return json({ requests });
};

export default function ExchangeRequests() {
  const { requests } = useLoaderData<{ requests: ExchangeRequest[] }>();
  const fetcher = useFetcher();

  const handleApprove = (id: number) => {
    fetcher.submit(
      { intent: "approve", id: id.toString() },
      { method: "POST", action: "/api/exchange-approve" }
    );
  };

  const handleReject = (id: number) => {
    fetcher.submit(
      { intent: "reject", id: id.toString() },
      { method: "POST", action: "/api/exchange-approve" }
    );
  };

  const rowMarkup = requests.map((req, index) => (
    <IndexTable.Row id={req.id.toString()} key={req.id} position={index}>
      <IndexTable.Cell>
        <Text as="span" fontWeight="semibold">
          {req.original_order_name || `#${req.shopify_order_id.split('/').pop()}`}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>{req.customer_email}</IndexTable.Cell>
      <IndexTable.Cell>
        <InlineStack gap="200">
          <Text as="span" tone="subdued">{req.original_product_title}</Text>
          <Text as="span">→</Text>
          <Text as="span" fontWeight="bold">{req.new_product_title}</Text>
        </InlineStack>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={req.status === 'pending' ? 'attention' : req.status === 'approved' ? 'success' : 'critical'}>
          {req.status}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        {req.status === 'pending' ? (
          <ButtonGroup>
            <Button size="slim" tone="success" onClick={() => handleApprove(req.id)}>Approve</Button>
            <Button size="slim" tone="critical" onClick={() => handleReject(req.id)}>Reject</Button>
          </ButtonGroup>
        ) : req.status === 'approved' && req.return_label_url ? (
          <Button size="slim" url={req.return_label_url} target="_blank">Label</Button>
        ) : null}
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page title="Exchange Requests">
      <Layout>
        <Layout.Section>
          {fetcher.data?.error && (
            <Banner tone="critical" title="Error">
              <p>{fetcher.data.error}</p>
            </Banner>
          )}
          <Card padding="0">
            {requests.length === 0 ? (
              <EmptyState
                heading="No requests found"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Requests will appear here when customers submit them.</p>
              </EmptyState>
            ) : (
              <IndexTable
                resourceName={{ singular: 'request', plural: 'requests' }}
                itemCount={requests.length}
                headings={[
                  { title: 'Order' },
                  { title: 'Customer' },
                  { title: 'Exchange' },
                  { title: 'Status' },
                  { title: 'Actions' },
                ]}
                selectable={false}
              >
                {rowMarkup}
              </IndexTable>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
