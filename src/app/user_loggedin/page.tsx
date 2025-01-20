import { redirect } from 'next/navigation';
export default async function UserLoggedIn() {
    redirect('/?version=premium')
}