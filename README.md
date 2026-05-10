# Swaply - Shopify Exchange App

Swaply is a lightweight, efficient Shopify app that allows customers to request product exchanges instead of just returns. It helps merchants retain revenue and provides a better customer experience.

## Core Features
- **Customer Side**: "Exchange" button on the order status page.
- **Product Search**: Customers can search and select replacement products/variants.
- **Merchant Dashboard**: Review, approve, or reject exchange requests.
- **Automated Workflow**: Approval creates a $0 Draft Order and generates a return label via ShipEngine.

## Tech Stack
- **Framework**: Remix v2 (Shopify App Remix template)
- **Database**: SQLite with Prisma
- **UI**: Shopify Polaris
- **Integrations**: ShipEngine API for return labels

## Setup Instructions

### 1. Prerequisites
- Shopify Partner account.
- A development store.
- ShipEngine API key (free tier available).

### 2. Environment Setup
Create a `.env` file in the root directory based on `.env.example`:
```env
SHOPIFY_API_KEY=xxx
SHOPIFY_API_SECRET=xxx
SCOPES=read_orders,write_orders,read_products,write_draft_orders,read_customers
HOST=https://your-app-url.vercel.app
SHIPENGINE_API_KEY=xxx
DATABASE_URL="file:./dev.db"
```

### 3. Installation
```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev --name init

# Start development server
npm run dev
```

### 4. Deploying to Vercel
1. Push your code to a GitHub repository.
2. Connect the repository to Vercel.
3. Add the environment variables in the Vercel dashboard.
4. Set the `DATABASE_URL` to a persistent database (e.g., Turso) for production.
5. Update your Shopify Partner dashboard with the production URLs:
   - **App URL**: `https://your-app.vercel.app`
   - **Allowed redirection URL**: `https://your-app.vercel.app/auth/callback`
   - **App Proxy**: 
     - Subpath: `apps/swaply`
     - URL: `https://your-app.vercel.app/apps/proxy`

### 5. Enabling the Customer UI
1. In your Shopify Partner dashboard, navigate to **Extensions**.
2. Deploy the `exchange-ui` extension.
3. In the Shopify Theme Editor, add the "Swaply Exchange Button" block to the **Order Status** or **Order Details** page.

## Testing Checklist
1. Install the app on a dev store.
2. Place a test order.
3. Visit the order status page and click "Exchange".
4. Select a new product and submit the request.
5. In the Shopify Admin, open the Swaply app and go to "Exchange Requests".
6. Approve the request and verify that a $0 Draft Order is created.
7. Check if a ShipEngine return label is generated (if API key is provided).

## License
MIT
```
