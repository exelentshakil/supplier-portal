# Shopify Supplier Portal

A Next.js web application that lets suppliers manage product availability in real-time. Built to solve the stock sync problem between suppliers and a Shopify store running Facebook ads.

## The Problem

Running Facebook ads with 1500+ products from external suppliers creates a nightmare scenario:
- Customer orders 10 products
- 4 are out of stock at supplier
- Manual coordination for 100+ daily orders = lost time, money, and reputation

## The Solution

Give suppliers a simple web portal where they can:
- Toggle products between Active (in stock) → visible in store
- Toggle products to Draft (out of stock) → hidden from customers
- Focus on priority products (under ৳500, ৳500-1000) that are actively advertised
- Bulk update multiple products at once

Changes sync instantly to Shopify. Facebook catalog updates hourly via XML feed.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS + shadcn/ui**
- **Shopify Admin API**
- **Vercel** (deployment)

## Features

- Real-time product status updates (Active/Draft)
- Priority filtering for ad products (Under ৳500, ৳500-1000)
- Bulk select and update
- Search by SKU or product title
- Color-coded rows (green=active, orange=draft)
- Sticky table headers for easy scrolling
- Last updated timestamps
- XML feed for Facebook Product Catalog
- Bengali + English instructions for suppliers

## Project Structure

```
/app
/api
/products
route.ts              # GET products by vendor
/[id]/route.ts        # PUT update product status
/collections
route.ts              # GET collections (optional)
/feed
route.ts              # GET XML feed for Facebook
page.tsx                  # Supplier dashboard UI
/lib
shopify.ts                # Shopify API helper functions
```

## Setup

1. Clone and install:
```bash
git clone <repo>
cd supplier-portal
npm install
```

2. Add environment variables (`.env.local`):
```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_admin_api_token
SHOPIFY_API_VERSION=2023-07
SHOPIFY_STORE_DOMAIN_LIVE=noonsbaby.com
```

3. Install shadcn/ui components:
```bash
npx shadcn@latest init
npx shadcn@latest add button card table badge input
```

4. Run locally:
```bash
npm run dev
```

5. Deploy to Vercel:
```bash
vercel --prod
```

## API Routes

### `GET /api/products?vendor=Wellbeing`
Returns all products for specified vendor

### `PUT /api/products/[id]`
Updates product status (active/draft)
```json
{ "status": "active" }
```

### `GET /api/feed`
Returns XML feed for Facebook Product Catalog
- Only active products
- Price in BDT
- Includes variant IDs, SKUs, compare_at_price

## Facebook Catalog Integration

Set Facebook to fetch feed from:
```
https://your-app.vercel.app/api/feed
```

Update frequency: Hourly (or as needed)

## What I Learned

- Shopify Admin API pagination and rate limiting
- Building supplier-focused UIs (not customer-facing)
- Real-time sync between external suppliers and e-commerce platforms
- Handling 1500+ products client-side efficiently
- Bengali localization for non-technical users
- XML feed generation for Facebook Product Catalogs

## Future Improvements

- Multi-vendor support with authentication
- Activity logs (who changed what, when)
- Email/SMS notifications on stock changes
- Low stock alerts
- CSV import/export
- Analytics dashboard

## Why This Matters

This isn't a CRUD app. It solves a real business problem:
- Saves hours of manual coordination per day
- Prevents overselling out-of-stock items
- Maintains ad campaign effectiveness
- Scales to multiple suppliers

Built in a weekend. Deployed to production. Actually used by suppliers daily.

---

Built with Next.js 15 + TypeScript + Shopify API