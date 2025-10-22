import { NextResponse } from "next/server";
import { fetchAllActiveProducts } from "@/lib/shopify";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateProductXml(product: any): string {
  const variant = product.variants[0];
  const image = product.images[0]?.src || "";
  const regularPrice = variant.compare_at_price || variant.price;
  const salePrice = variant.price;
  const liveDomain = process.env.SHOPIFY_STORE_DOMAIN_LIVE || process.env.SHOPIFY_STORE_DOMAIN?.replace('.myshopify.com', '.com');
  const productUrl = `https://${liveDomain}/products/${product.handle}?variant=${variant.id}`;
  
  // Check if product is in stock - only out of stock if inventory is tracked AND quantity is 0
  const isInStock = variant.inventory_management !== 'shopify' || variant.inventory_quantity > 0;
  const availability = isInStock ? 'in stock' : 'out of stock';
  
  // Use full title and strip HTML from body_html for description
  const description = stripHtml(product.body_html || product.title);
  const sku = variant.sku || "";

  return `
    <item>
      <title>${sanitizeXml(product.title)}</title>
      <link>${sanitizeXml(productUrl)}</link>
      <description>${sanitizeXml(description)}</description>
      <g:google_product_category></g:google_product_category>
      <g:item_group_id>${product.id}</g:item_group_id>
      <g:id>${variant.id}</g:id>
      <g:condition>new</g:condition>
      <g:price>${sanitizeXml(regularPrice)} BDT</g:price>
      <g:sale_price>${sanitizeXml(salePrice)} BDT</g:sale_price>
      <g:availability>${availability}</g:availability>
      <g:image_link>${sanitizeXml(image)}</g:image_link>
      <g:gtin></g:gtin>
      <g:brand>${sanitizeXml(product.vendor)}</g:brand>
      <g:mpn>${sanitizeXml(sku)}</g:mpn>
      <g:product_type></g:product_type>
      <g:age_group></g:age_group>
      <g:gender></g:gender>
      <g:custom_label_0></g:custom_label_0>
      <g:custom_label_1></g:custom_label_1>
      <g:custom_label_2></g:custom_label_2>
      <g:custom_label_3></g:custom_label_3>
      <g:custom_label_4></g:custom_label_4>
      <g:shipping_weight>0.0 kg</g:shipping_weight>
    </item>`;
}

export async function GET() {
  try {
    const products = await fetchAllActiveProducts();

    const items = products.map(generateProductXml).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Product Feed</title>
    <link>https://${process.env.SHOPIFY_STORE_DOMAIN_LIVE}</link>
    <description>Active products feed for Facebook Catalog</description>
    <total_items>${products.length}</total_items>
    ${items}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error("Error generating feed:", error);
    return NextResponse.json(
      { error: "Failed to generate feed" },
      { status: 500 }
    );
  }
}