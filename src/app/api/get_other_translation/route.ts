import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const elementType = searchParams.get('element_type');
    const elementId = searchParams.get('element_id');
    const language = searchParams.get('language');
    const elementSubtype = searchParams.get('element_subtype');
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_other_translation?element_type=${elementType}&element_id=${elementId}&language=${language}&element_subtype=${elementSubtype}`)
    const data = await response.json();
    return NextResponse.json(data);
}