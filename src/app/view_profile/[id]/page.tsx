import EmptyProfileComponent from '@/components/EmptyProfileComponent';
import ProfileComponent from '@/components/ProfileComponent';
import { User, Webnovel } from '@/components/Types';
import { decrypt } from '@/utils/cryptography';

export default async function ViewProfile({ params: { id }, }: { params: { id: string } }) {
    // must do this because profile can be any user's

    async function getUser() {
        console.log("getting user by id")
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_user_by_id?id=${id}`,
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
        console.log(user)
        return user;
    }

    async function fetchNovels(user: User) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels_by_email_hash?email_hash=${user.email_hash}`);
        if (!response.ok) {
            const errorData = await response.json();
            console.error(errorData);
            return null;
        }
        const novels: Webnovel[] = await response.json();
        return novels;
    }

    const user = await getUser();
    console.log(user)
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
