"use client"
import AddWebnovelComponent from '@/components/AddWebnovelComponent';
import { useUser } from '@/contexts/UserContext';

const NewNovel = () => {
    const {email, nickname} = useUser();
    return (
        <AddWebnovelComponent email={email} nickname={nickname}/>
    );
};

export default NewNovel;