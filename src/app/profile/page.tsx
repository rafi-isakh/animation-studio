import { auth, signOut } from "@/auth"

 
export default async function Profile() {
  const session = await auth()

  if (session) {
    if (!session.user) return null
    
    return (
        <div>
        <center>
          <h2>{session.user.name}</h2>
          <img src={session.user.image} alt="Profile" />
          <form
            action={async (formData) => {
              "use server"
              await signOut({redirectTo:"/"})
            }}
          >
            <button type="submit">Sign out</button>
          </form>
        </center>
        </div>
    )
  }
}