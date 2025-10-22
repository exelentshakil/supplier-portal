import { NextResponse } from "next/server";
import { updateProductStatus } from "@/lib/shopify";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    const productId = parseInt(params.id);

    if (!status || !["active", "draft"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    const result = await updateProductStatus(productId, status);

    return NextResponse.json({
      success: true,
      product: result.product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update product" },
      { status: 500 }
    );
  }
}