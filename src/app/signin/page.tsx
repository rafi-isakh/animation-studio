import SignInComponent from '@/components/SignInComponent';
import { GoogleSignIn, KakaoSignIn } from '@/utils/SignIn';


export default function SignIn() {

  return (
    <div>
      <SignInComponent/>
      <div className="flex flex-col space-y-4 m-4 justify-center" >
          <GoogleSignIn></GoogleSignIn>
          <KakaoSignIn></KakaoSignIn>
      </div>
    </div>

  );

}
