import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }
    const { imp_uid } = await request.json();
    console.log('imp_uid', imp_uid);

    const getToken = await fetch("https://api.iamport.kr/users/getToken", {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            // REST API키
            imp_key: process.env.PORTONE_API_KEY,
            imp_secret: process.env.PORTONE_API_SECRET,
        }),
    });
    if (!getToken.ok) {
        console.error('Failed to get token', getToken.status);
        return new NextResponse("Failed to get token", { status: getToken.status });
    }
    const {access_token} = await getToken.json();

    const getCertifications = await fetch(`https://api.iamport.kr/certifications/${imp_uid}`, {
        headers: { Authorization: access_token },
    });
    if (!getCertifications.ok) {
        console.error('Failed to get certifications', getCertifications.status);
        return new NextResponse("Failed to get certifications", { status: getCertifications.status });
    }
    const { birth } = await getCertifications.json();

    const today = new Date();
    const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    if (new Date(birth) > eighteenYearsAgo) {
        console.error('Too young', birth);
        return new NextResponse(`Too young: ${birth}`, { status: 401 });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/verify_as_adult`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${session.accessToken}`,
            "Provider": session.provider,
        },
        body: JSON.stringify({ imp_uid }),
    });
    if (!response.ok) {
        const error = await response.text();
        console.error('Failed to verify as adult', error);
        return new NextResponse(error, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
}