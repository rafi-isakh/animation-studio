import EmptyProfileComponent from '@/components/EmptyProfileComponent';
import ProfileComponent from '@/components/ProfileComponent';
import { User, Webnovel } from '@/components/Types';
import UserBlockedComponent from '@/components/UserBlockedComponent';

async function getUser(id: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_user_by_id?id=${id}`,
        {
            cache: 'no-store'
        }
    );
    if (!response.ok) {
        const errorData = await response.json();
        console.error(errorData);
        return null;
    }
    const user: User = await response.json();
    return user;
}


async function fetchNovels(user: User) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_webnovels_by_email_hash?email_hash=${user.email_hash}`);
    if (!response.ok) {
        const errorData = await response.json();
        console.error(errorData);
        return null;
    }
    const novels: Webnovel[] = await response.json();
    return novels;
}
export default async function ViewProfile({ params: { id }, }: { params: { id: string } }) {
    const user = await getUser(id);
    let novels: Webnovel[] | null = [];
    if (user) {
        novels = await fetchNovels(user);
    } else {
        return (
            <EmptyProfileComponent />
        )
    }
    if (user && novels) {
        return (
            <ProfileComponent user={user} novels={novels} />
        );
    } else {
        return (
            <EmptyProfileComponent />
        )
    }
}
