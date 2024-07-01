import { auth } from "@/auth";
import { redirect } from "next/navigation";
import MyWebnovelsComponent from "@/components/MyWebnovels";

const MyWebnovels = async () => {
    const session = await auth();
    if (session && session.user) {
        return (
            <MyWebnovelsComponent email={session.user.email}/>
        )
    } else {
        redirect('/signin');
    };
}

export default MyWebnovels;