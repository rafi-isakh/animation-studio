import { auth } from "@/auth";
import {useAuth} from "@/components/AuthContext";
import WebnovelComponent from "@/components/WebnovelComponent";
import { redirect } from "next/navigation";

const MyWebnovels = async () => {
    const session = await auth();
    if (session && session.user) {
        const res = await fetch(`http://localhost:5000/api/get_webnovel_byuser?user_email=${session.user.email}`,
                        {cache: 'force-cache'}).then(r => r.json());
        return (
            <div>
                <center>
                    <WebnovelComponent webnovel={res}/>
                </center>
            </div>
        );
    } else {
        redirect('/signin');
    };
}

export default MyWebnovels;