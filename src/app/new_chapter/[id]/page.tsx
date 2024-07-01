import WriteComponent from "@/components/WriteComponent"
import {WebnovelIdProps} from "@/components/Types"

function NewChapter ({params: {id}, }: {params: {id: number}}) {
    return (
        <WriteComponent webnovelId={id} />
    );
};

export default NewChapter;