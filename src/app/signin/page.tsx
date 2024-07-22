import { GoogleSignIn, KakaoSignIn, NaverSignIn, AppleSignIn, FacebookSignIn } from '@/components/SignIn';

export default function SignIn() {
  return (
    <div>
      <div className="flex justify-center text-2xl font-semibold">Sign In</div>
      <div className="flex flex-row space-x-4 m-4 justify-center" >
          <GoogleSignIn></GoogleSignIn>
          <KakaoSignIn></KakaoSignIn>
          <NaverSignIn></NaverSignIn>
      </div>
    </div>

  );

}
