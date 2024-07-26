import { Webnovel } from "@/components/Types";
import WebnovelComponent from "@/components/WebnovelComponent";

const LibraryComponent = ({ library }: { library: Webnovel[] }) => {
    return (
        <div className="flex flex-col space-y-8">
            <div className="text-2xl font-bold">읽고 있는 웹소설</div>
            <div className="flex flex-wrap space-x-4">
            {library.map((item, index) => (
                <WebnovelComponent key={index} webnovel={item} index={index} ranking={false} width={200} height={120} />
            ))}
            </div>
        </div>
    )
}

export default LibraryComponent;