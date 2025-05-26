export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { User } from '@/components/Types';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (session && session.user) {
            const email = session.user.email
            if (!email) {
                return NextResponse.json({ loggedIn: false, error: 'User email not in session' }, { status: 500 });
            }
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_session_user`,
                {
                    headers: {
                        'Authorization': `Bearer ${session.accessToken}`,
                        'Provider': session.provider
                    }
                }
            )
            if (!response.ok) {
                console.error(`Error fetching user by email: ${email}`, response.statusText);
                return NextResponse.json({ loggedIn: false, error: 'Failed to fetch user' }, { status: response.status });
            }

            const data = await response.json();

            if (!data || !data.id) {
                console.error('Invalid user data:', data);
                return NextResponse.json({ loggedIn: false, error: 'Invalid user data' }, { status: 500 });
            }

            const user: User = data;

            return NextResponse.json({
                loggedIn: true,
                nickname: user.nickname,
                bio: user.bio,
                id: user.id.toString(),
                email: email,
                email_hash: user.email_hash,
                stars: user.stars,
                free_stars: user.free_stars,
                english_stars: user.english_stars,
                free_english_stars: user.free_english_stars,
                tickets: user.tickets,
                picture: user.picture,
                purchased_webnovel_chapters: user.purchased_webnovel_chapters,
                upvoted_comments: user.upvoted_comments,
                genres: user.genres,
                is_adult: user.is_adult,
            });
        } else {
            return NextResponse.json({
                loggedIn: false,
                nickname: "",
                bio: "",
                id: "",
                email: "",
                email_hash: "",
                stars: 0,
                free_stars: 0,
                english_stars: 0,
                free_english_stars: 0,
                tickets: 0,
                picture: "",
                purchased_webnovel_chapters: "[]",
                upvoted_comments: "",
                genres: "[]",
                is_adult: false,
            });
        }
    } catch (error) {
        console.error('Error in auth API:', error);
        return NextResponse.json({ loggedIn: false, error: 'Internal Server Error' }, { status: 500 });
    }
}