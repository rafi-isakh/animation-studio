import { Button } from "@mui/material";
import { MdStars } from "react-icons/md";

export default function PurchasePointsComponent() {
    const pointsOptions = [10, 30, 50, 100, 300]

    return (
        <div className="flex flex-col w-[400px] space-y-4 items-center justify-center m-auto tall:h-[calc(100vh-16rem)]">
            <h1 className="text-2xl font-extrabold">포인트 구매</h1>
            {pointsOptions.map((points, index) => (
                <Button key={index} href={`/toss/${points}`} variant="outlined" color="gray" className="text-xl flex items-center justify-between w-full">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                            <MdStars className="text-xl text-pink-500" />
                            <h1 className="text-xl">{points.toLocaleString()}</h1>
                        </div>
                        <h1 className="text-xl">{(points * 100).toLocaleString()}원</h1>
                    </div>
                </Button>
            ))}
        </div>
    );
}
