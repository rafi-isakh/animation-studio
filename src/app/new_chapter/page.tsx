import { auth } from "@/auth";
import AIEditorComponent from "@/components/AIEditorComponent";
import AddChapterComponent from "@/components/AddChapterComponent";


async function getWebnovels() {
    const session = await auth();
    const email = session?.user.email;

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels_byemail?email=${email}`)
    const data = await response.json();
    return data;
}

async function NewChapter({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const id = searchParams.id;
    if (typeof id === 'string') {
    // Handle single string value
    } else if (Array.isArray(id)) {
    // Handle array of strings
        throw new Error("there should be only one id param")
    } else {
    // Handle undefined case
        throw new Error("id param should be present")
    }

    if (id) {
        return (
            <AddChapterComponent webnovelId={id} webnovels={await getWebnovels()} />
        );
    }
    else {
        return (
            <div></div>
        )
    }
};

export default NewChapter;