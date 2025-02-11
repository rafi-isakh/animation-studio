'use client'

import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const UserProfileButton = () => {
    const { email, nickname, picture } = useUser();
    const { isLoggedIn } = useAuth();

    return (
        <Link href="/my_profile">
           { picture ? <Image src={picture} alt="User Profile" className='w-10 h-10 rounded-full' /> : <User size={20} className='text-gray-400' />}
        </Link>
    )
}

export default UserProfileButton;