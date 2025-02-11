'use client'

import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from "@/utils/urls";

const UserProfileButton = () => {
    const { email, nickname, picture } = useUser();
    const { isLoggedIn } = useAuth();

    return (
        <Link href="/my_profile">
            {picture ?
                <div className='w-8 h-8 rounded-full overflow-hidden shadow-md'>
                    <Image src={getImageUrl(picture)} alt={nickname} width={15} height={15} sizes='100vw' quality={80} className='rounded-full object-center object-cover w-full h-full' />
                </div> : <User size={20} className='text-gray-400' />}
        </Link>
    )
}

export default UserProfileButton;