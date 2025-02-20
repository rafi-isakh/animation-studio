import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_toonyz_post_by_id?id=${id}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch toonyz post with id ${id}`)
    }
    const data = await response.json();
    return NextResponse.json(data);
}



// export async function GET(request: NextRequest) {
//     const { searchParams } = new URL(request.url);
//     const id = searchParams.get('id');
//     const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webtoon_by_id?id=${id}`);
//     if (!response.ok) {
//         throw new Error(`Failed to fetch webtoon with id ${id}`)
//     }
//     const data = await response.json();
//     return NextResponse.json(data);
// }