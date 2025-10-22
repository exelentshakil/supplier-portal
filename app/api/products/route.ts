import { NextResponse } from "next/server";
import { fetchProductsByVendor } from "@/lib/shopify";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendor = searchParams.get("vendor") || "Wellbeing";
    const collectionId = searchParams.get("collection");

    let products;
    

      products = await fetchProductsByVendor(vendor);
    

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}