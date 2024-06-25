import { GoogleSignIn, KakaoSignIn, NaverSignIn, AppleSignIn, FacebookSignIn } from '@/components/SignIn';

export default function Home() {
  return (
    <div className="flex flex-col space-y-4 m-4 place-items-center">
            <GoogleSignIn></GoogleSignIn>
            <KakaoSignIn></KakaoSignIn>
            <NaverSignIn></NaverSignIn>
    </div>
  );
}
