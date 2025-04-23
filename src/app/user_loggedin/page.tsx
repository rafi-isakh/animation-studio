"use client"

import { redirect } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

export default function UserLoggedIn() {
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('returnTo') || '/';

    redirect(returnTo);
}