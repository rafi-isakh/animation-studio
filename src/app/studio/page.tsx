import Link from "next/link";

export default function Studio() {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <Link href="/studio/novel">웹소설 스튜디오</Link>
            <Link href="/studio/pictures">이미지 스튜디오</Link>
        </div>
    );
}