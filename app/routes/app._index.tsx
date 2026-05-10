import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Button,
  Box,
  Divider,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { db } from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const [total, pending, approved, rejected] = await Promise.all([
    db.exchangeRequest.count({ where: { shop: session.shop } }),
    db.exchangeRequest.count({ where: { shop: session.shop, status: "pending" } }),
    db.exchangeRequest.count({ where: { shop: session.shop, status: "approved" } }),
    db.exchangeRequest.count({ where: { shop: session.shop, status: "rejected" } }),
  ]);

  const recentRequests = await db.exchangeRequest.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return json({ total, pending, approved, rejected, recentRequests });
};

export default function AppIndex() {
  const { total, pending, approved, rejected, recentRequests } = useLoaderData<typeof loader>();

  const stats = [
    {
      label: "Total Requests",
      value: total,
      color: "#6c63ff",
      bg: "rgba(108,99,255,0.1)",
      icon: "🔄",
    },
    {
      label: "Pending",
      value: pending,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
      icon: "⏳",
    },
    {
      label: "Approved",
      value: approved,
      color: "#10b981",
      bg: "rgba(16,185,129,0.1)",
      icon: "✅",
    },
    {
      label: "Rejected",
      value: rejected,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.1)",
      icon: "❌",
    },
  ];

  return (
    <Page title="Swaply Dashboard">
      <BlockStack gap="600">
        {pending > 0 && (
          <Banner
            title={`You have ${pending} pending exchange request${pending === 1 ? "" : "s"}`}
            tone="warning"
            action={{ content: "Review Now", url: "/app/exchanges" }}
          />
        )}

        {/* ── Stats Cards ── */}
        <Layout>
          {stats.map((s) => (
            <Layout.Section key={s.label} variant="oneQuarter">
              <Card>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "4px 0",
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 12,
                      background: s.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      flexShrink: 0,
                    }}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 28,
                        fontWeight: 700,
                        color: s.color,
                        lineHeight: 1.2,
                      }}
                    >
                      {s.value}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>{s.label}</p>
                  </div>
                </div>
              </Card>
            </Layout.Section>
          ))}
        </Layout>

        <Layout>
          {/* ── Recent Requests ── */}
          <Layout.Section variant="twoThirds">
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">
                    Recent Requests
                  </Text>
                  <Button variant="plain" url="/app/exchanges">
                    View all
                  </Button>
                </InlineStack>
                <Divider />
                {recentRequests.length === 0 ? (
                  <Box paddingBlock="600">
                    <BlockStack align="center" inlineAlign="center" gap="200">
                      <Text as="p" tone="subdued" alignment="center">
                        🎉 No exchange requests yet.
                      </Text>
                      <Text as="p" tone="subdued" alignment="center" variant="bodySm">
                        They'll appear here once customers start requesting exchanges.
                      </Text>
                    </BlockStack>
                  </Box>
                ) : (
                  <BlockStack gap="300">
                    {recentRequests.map((req) => (
                      <div
                        key={req.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 0",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        <div>
                          <Text as="p" fontWeight="semibold">
                            Order {req.shopifyOrderNumber}
                          </Text>
                          <Text as="p" tone="subdued" variant="bodySm">
                            {req.customerName} · {req.originalProductTitle} →{" "}
                            {req.newProductTitle}
                          </Text>
                        </div>
                        <Badge
                          tone={
                            req.status === "pending"
                              ? "attention"
                              : req.status === "approved"
                                ? "success"
                                : "critical"
                          }
                        >
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </Badge>
                      </div>
                    ))}
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* ── Quick Setup Guide ── */}
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Quick Setup
                </Text>
                <Divider />
                <BlockStack gap="300">
                  {[
                    {
                      step: "1",
                      label: "Add Exchange Button",
                      desc: "Install the theme app extension to add the Exchange button to your order status page",
                      done: true,
                    },
                    {
                      step: "2",
                      label: "Configure ShipEngine",
                      desc: "Add your ShipEngine API key to generate return labels automatically",
                      done: !!process.env.SHIPENGINE_API_KEY,
                    },
                    {
                      step: "3",
                      label: "Test an Exchange",
                      desc: "Place a test order and click the Exchange button to verify the flow",
                      done: total > 0,
                    },
                  ].map((item) => (
                    <InlineStack key={item.step} gap="300" blockAlign="start">
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: item.done ? "#10b981" : "#e5e7eb",
                          color: item.done ? "#fff" : "#6b7280",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {item.done ? "✓" : item.step}
                      </div>
                      <BlockStack gap="100">
                        <Text as="p" fontWeight="semibold" variant="bodySm">
                          {item.label}
                        </Text>
                        <Text as="p" tone="subdued" variant="bodySm">
                          {item.desc}
                        </Text>
                      </BlockStack>
                    </InlineStack>
                  ))}
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
