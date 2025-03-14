import { auth } from "@/auth";
import { redirect } from "next/navigation";
import StarShopAside from "@/components/UI/StarShopAside";

export default async function StarsLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        redirect("/signin");
    }
    return (
        <div className="relative md:max-w-screen-xl w-full mx-auto flex flex-col md:flex-row">
            {/* aside part */}
            <StarShopAside email={email ?? ""} />
            {/* main part */}
            <div className="flex-1  w-full flex-grow flex-shrink-0">
                {children}
            </div>
        </div>
    );
};