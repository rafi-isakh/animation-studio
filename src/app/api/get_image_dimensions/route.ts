import { getImageDimensions } from "@/utils/imageDimensions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("imageUrl");
    if (!imageUrl) {
        return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }
    const dimensions = await getImageDimensions(imageUrl);
    if (!dimensions) {
        return NextResponse.json({ error: "Failed to get image dimensions" }, { status: 500 });
    }
    return NextResponse.json(dimensions);
}