import { auth } from "@/auth";
import ViewWebnovelsComponent from "@/components/ViewWebnovelsComponent";

async function getWebnovel(id: string | string[] | undefined) {
    if (Array.isArray(id)) {
        throw new Error("there should be just one id")
    } if (id == undefined) {
        return null;
    }
    try {
        const webnovelResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovel_byid?id=${id}`, { cache: 'no-store' });
        if (!webnovelResponse.ok) {
            console.error("Failed to fetch webnovel")
            return null;
        }
        const data = await webnovelResponse.json();
        return data;
    } catch {
        console.error(`Error fetching webnovel ${id}`)
    }
}

async function getUserWebnovels(email: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels_byemail?email=${email}`, { cache: 'no-store' });
    if (!response.ok) {
        console.error("Failed to fetch webnovels");
        return null;
    }
    const data = await response.json();
    return data;
}

const ViewWebnovels = async ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
    const webnovel = await getWebnovel(searchParams.id);
    if (webnovel) {
        const { email: author_email, nickname: user_nickname } = webnovel.user;
        const userWebnovels = await getUserWebnovels(author_email);

        const session = await auth();   
        const email = session?.user.email;

        if (email) {
            const addToLibraryResponse = await fetch(`/api/add_to_library?email=${email}&webnovel_id=${searchParams.id}`)
            if (!addToLibraryResponse.ok) {
                console.error(`Add to library failed for ${email}, webnovel ${searchParams.id}`)
            }
        }
        return (
            <ViewWebnovelsComponent searchParams={searchParams} webnovel={webnovel} userWebnovels={userWebnovels} email={email} />
        )
    } else {
        return (
            <ViewWebnovelsComponent searchParams={searchParams} webnovel={null} userWebnovels={null} email=""/>
        )
    }

}

export default ViewWebnovels;