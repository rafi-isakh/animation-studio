import ViewWebnovelsComponent from "@/components/ViewWebnovelsComponent";

async function getWebnovels(id: string | string[] | undefined) {
    if (Array.isArray(id)) {
        throw new Error("there should be just one id")
    } if (id == undefined) {
        return {};
    }
    const webnovelResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovel_byid?id=${id}`);
    return await webnovelResponse.json();
}

const ViewWebnovels = async ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
    return (
        <ViewWebnovelsComponent searchParams={searchParams} webnovel={await getWebnovels(searchParams.id)}/>
    )
}

export default ViewWebnovels;