import SignInComponent from '@/components/SignInComponent';
import { GoogleSignIn, KakaoSignIn } from '@/utils/SignIn';
import Link from "next/link";

export default function SignIn() {
 
  return (
    <div className='flex flex-col items-center justify-center h-[70vh] mt-10 !p-10'>
      <div className="flex flex-col items-center justify-center lg:px-10 md:px-10 py-20 rounded-xl border border-gray-300">
          <SignInComponent/>
        <div className="flex flex-col space-y-4 m-4 justify-center mb-14" >
          <GoogleSignIn></GoogleSignIn>
          <KakaoSignIn></KakaoSignIn>
        </div>
      </div>
 
      <div className="flex flex-row gap-4 mt-10">
          <p className="text-center text-[10px] font-extrabold text-gray-400 hover:text-pink-600">
            <Link href="/terms">이용약관</Link> 
          </p>
          <p className="text-center text-[10px]  text-gray-400 hover:text-pink-600"> 
            <Link href="/terms/privacy">개인정보 처리방침</Link> 
          </p>
          <p className="text-center text-[10px] font-extrabold text-gray-400"> 
          © Stella& Inc.
          </p>
      </div>
    </div>
  );

}
