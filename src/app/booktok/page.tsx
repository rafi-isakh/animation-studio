import SpatialUI from "@/components/UI/booktok/SpatialUI"

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center bg-white dark:bg-white p-4">

            <div className="flex flex-row">
                <div className="w-full max-w-xl">
                    <SpatialUI />
                </div>
            </div>
        </div>
    )
}
