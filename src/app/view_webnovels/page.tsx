import ViewWebnovelsComponent from "@/components/ViewWebnovelsComponent";

const ViewWebnovels = ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
    return (
        <ViewWebnovelsComponent searchParams={searchParams}/>
    )
}

export default ViewWebnovels;