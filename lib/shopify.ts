// Shopify API helper functions

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2023-07";

const HEADERS = {
  "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
  "Content-Type": "application/json",
};

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  handle: string;
  vendor: string;
  product_type: string;
  status: string;
  updated_at: string;
  variants: Array<{
    id: number;
    price: string;
    compare_at_price?: string;
    inventory_quantity: number;
    inventory_management?: string;
    sku?: string;
  }>;
  images: Array<{
    src: string;
  }>;
  tags: string;
}

export async function fetchProductsByVendor(vendor: string = "Wellbeing") {
  let allProducts: ShopifyProduct[] = [];
  let url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=250&vendor=${encodeURIComponent(vendor)}`;

  while (url) {
    const response = await fetch(url, { headers: HEADERS });
    
    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`);
    }

    const data = await response.json();
    allProducts = allProducts.concat(data.products || []);

    // Handle pagination
    const linkHeader = response.headers.get("link");
    const nextLink = linkHeader?.match(/<([^>]+)>;\s*rel="next"/);
    url = nextLink ? nextLink[1] : "";
  }

  return allProducts;
}

export async function fetchAllActiveProducts() {
  let allProducts: ShopifyProduct[] = [];
  let url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=250&status=active`;

  while (url) {
    const response = await fetch(url, { headers: HEADERS });
    
    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`);
    }

    const data = await response.json();
    allProducts = allProducts.concat(data.products || []);

    const linkHeader = response.headers.get("link");
    const nextLink = linkHeader?.match(/<([^>]+)>;\s*rel="next"/);
    url = nextLink ? nextLink[1] : "";
  }

  return allProducts;
}

export async function updateProductStatus(productId: number, status: "active" | "draft") {
  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/products/${productId}.json`;
  
  const response = await fetch(url, {
    method: "PUT",
    headers: HEADERS,
    body: JSON.stringify({
      product: { status }
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update product: ${response.status}`);
  }

  const result = await response.json();
  return result;
}