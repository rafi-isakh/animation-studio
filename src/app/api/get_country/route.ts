import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');

    const response = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.IP_GEOLOCATION_API_KEY}&ip=${clientIp}`);
    if (!response.ok) {
        throw new Error("Failed to fetch country info");
    }
    const data = await response.json();
    return NextResponse.json(data.country_code2);
}