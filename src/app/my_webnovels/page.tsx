import { auth } from "@/auth";
import {useAuth} from "@/components/AuthContext";
import { redirect } from "next/navigation";

const MyWebnovels = async () => {
    const session = await auth();
    if (session && session.user) {
        const res = await fetch(`http://localhost:5000/api/get_webnovel_byuser?user_email=${session.user.email}`,
                        {cache: 'force-cache'}).then(r => r.json());
        return (
            <div>
                {JSON.stringify(res)}
            </div>
        );
    } else {
        redirect('/signin');
    };
}

export default MyWebnovels;