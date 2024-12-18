import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
    const data = await req.json();
    const { treatment, episode } = data; // episode is a subset of treatment
    console.log("treatment", treatment);
    console.log("episode", episode);

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ONOMA}/api/external/fabulator/generate/scenario?apiKey=${process.env.ONOMA_API_KEY}&treatment=${encodeURIComponent(treatment)}&episode=${encodeURIComponent(episode)}`)

        if (!response.ok) {
            console.error(response.statusText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const stream = new ReadableStream({
            async start(controller) {
                while (true) {
                    const { done, value } = await reader?.read() ?? { done: true, value: undefined };
                    if (done) break;
                    controller.enqueue(value);
                }
                controller.close();
            },
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}