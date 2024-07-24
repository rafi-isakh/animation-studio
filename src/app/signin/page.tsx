import SignInComponent from '@/components/SignInComponent';
import { GoogleSignIn, KakaoSignIn, NaverSignIn, AppleSignIn, FacebookSignIn } from '@/utils/SignIn';


export default function SignIn() {

  return (
    <div>
      <SignInComponent/>
      <div className="flex flex-row space-x-4 m-4 justify-center" >
          <GoogleSignIn></GoogleSignIn>
          <KakaoSignIn></KakaoSignIn>
          <NaverSignIn></NaverSignIn>
      </div>
    </div>

  );

}
