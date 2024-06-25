import { signIn } from "@/auth"
 
export function GoogleSignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("google")
      }}
    >
      <button className="rounded-full bg-blue-500 py-1 px-2 text-white font-bold" type="submit">Signin with Google</button>
    </form>
  )
} 

export function KakaoSignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("kakao")
      }}
    >
      <button className="rounded-full bg-blue-500 py-1 px-2 text-white font-bold" type="submit">Signin with Kakao</button>
    </form>
  )
} 

export function NaverSignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("naver")
      }}
    >
      <button className="rounded-full bg-blue-500 py-1 px-2 text-white font-bold" type="submit">Signin with Naver</button>
    </form>
  )
} 

export function AppleSignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("apple")
      }}
    >
      <button className="rounded-full" type="submit">Signin with Apple</button>
    </form>
  )
} 

export function FacebookSignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("facebook")
      }}
    >
      <button className="rounded-full" type="submit">Signin with Faecebook</button>
    </form>
  )
} 