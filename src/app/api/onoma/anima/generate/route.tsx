export const maxDuration = 300; // This function can run for a maximum of 300 seconds

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const data = await req.json();
    const { prompt } = data;

    const sendData = {
        apiKey: process.env.ONOMA_API_KEY,
        qty: 4,
        prompt: prompt,
        aspectRatio: '1:1',
        addedStyle: 'default'
    }

    console.log(sendData);
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ONOMA}/api/external/anima/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sendData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
