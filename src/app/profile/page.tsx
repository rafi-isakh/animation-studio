import { auth, signOut } from "@/auth"
import Link from 'next/link';
 
export default async function Profile() {
  const session = await auth()

  if (session) {
    if (!session.user) return null
    
    return (
        <div>
        <center>
          <h2>{session.user.name}</h2>
          <img src={session.user.image} alt="User Avatar" />
          <Link href="/signout">Sign out</Link>
        </center>
        </div>
    )
  }
}