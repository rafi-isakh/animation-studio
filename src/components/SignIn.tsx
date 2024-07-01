import { signIn } from "@/auth"
import Image from "next/image"

export function GoogleSignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("google",{ redirectTo: "/new_user" })
      }}
    > 
      <button type="submit"><Image src="/google_logo.svg" alt="Google Sign In" width={50} height={50}></Image></button>
    </form>
  )
} 

export function KakaoSignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("kakao", {redirectTo: "/"})
      }}
    >
      <button type="submit"><Image src="/kakao_logo.svg" alt="Kakao Sign In" width={50} height={50}></Image></button>
    </form>
  )
} 

export function NaverSignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("naver", {redirectTo: "/"})
      }}
    >
      <button><Image src="/naver_logo.svg" alt="Naver Sign In" width={50} height={50}></Image></button>
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