"use client"
import { useUser } from "@/contexts/UserContext";

const Test = () => {
    const {nickname} = useUser();
    return (
        nickname
    )
}
export default Test;