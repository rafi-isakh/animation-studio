'use client'

import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from "@/utils/urls";

const UserProfileButton = ({ expanded }: { expanded: boolean }) => {
    const { email, nickname, picture } = useUser();
    const { isLoggedIn } = useAuth();

    return (
        <Link href="/my_profile" className="relative flex flex-row py-2 px-6 my-1 text-gray-400">
            {picture ?
                    <div className='relative w-8 h-8 rounded-full overflow-hidden shadow-md'>
                        <Image src={getImageUrl(picture)} alt={nickname} width={15} height={15} sizes='100vw' quality={80} className='rounded-full object-center object-cover w-full h-full' />
                    </div>
                : <User size={20} className='text-gray-400' />
            }
            <span className={`overflow-hidden transition-all text-left ${expanded ? "w-40 ml-3" : "w-0"}`}>{nickname}</span>
        </Link>
    )
}

export default UserProfileButton;