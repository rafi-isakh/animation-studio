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
      <button type="submit">
        <Image src="/google_logo.svg" alt="Google Sign In" width={50} height={50}
        placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg==" // 추가
        >
        </Image></button>
    </form>
  )
} 

export function KakaoSignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("kakao", {redirectTo: "/new_user"})
      }}
    >
      <button type="submit"><Image src="/kakao_logo.svg" alt="Kakao Sign In" width={50} height={50}
        placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg==" // 추가
        >
      </Image></button>
    </form>
  )
} 

export function NaverSignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("naver", {redirectTo: "/new_user"})
      }}
    >
      <button><Image src="/naver_logo.svg" alt="Naver Sign In" width={50} height={50}
        placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg==" // 추가
      ></Image></button>
    </form>
  )
} 

export function AppleSignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("apple", {redirectTo: '/new_user'})
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
        await signIn("facebook", {redirectTo: 'new_user'})
      }}
    >
      <button className="rounded-full" type="submit">Signin with Faecebook</button>
    </form>
  )
} 