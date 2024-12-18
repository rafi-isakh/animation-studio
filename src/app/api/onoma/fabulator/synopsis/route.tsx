import { NextRequest, NextResponse } from "next/server";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
    const data = await req.json();
    const { logline, mainCharacters, subCharacters, episodeConfig } = data;

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ONOMA}/api/external/fabulator/generate/synopsis?apiKey=${process.env.ONOMA_API_KEY}&logline=${logline}&mainCharacters=${mainCharacters}&subCharacters=${subCharacters}&episodeConfig=${episodeConfig}`)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        const stream = new ReadableStream({
            async start(controller) {
                while (true) {
                    const { done, value } = await reader?.read() ?? { done: true, value: undefined };
                    if (done) {
                        if (buffer.length > 0) {
                            controller.enqueue(buffer);
                        }
                        break;
                    }
                    const decodedValue = decoder.decode(value, { stream: true });
                    buffer += decodedValue;
                    controller.enqueue(buffer);
                    buffer = '';
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
