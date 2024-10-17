import SignInComponent from '@/components/SignInComponent';
import { GoogleSignIn, KakaoSignIn } from '@/utils/SignIn';



export default function SignIn() {

  return (
    <div className='flex items-center justify-center min-h-full mt-10 !p-10'>
      <div className="flex flex-col items-center justify-center lg:px-10 md:px-10 px-[22px] py-20 rounded-xl border border-gray-300">
      
      <SignInComponent/>
     
        <div className="flex flex-col space-y-4 m-4 justify-center mb-14" >
          <GoogleSignIn></GoogleSignIn>
          <KakaoSignIn></KakaoSignIn>
        </div>

          {/* <p className="text-center text-[10px] py-6"> Not a member? 
            <span className='font-extrabold text-pink-600 hover:text-purple-700'> Sign up to join Toonyz Today </span>
          </p> */}
     
      </div>

    </div>

  );

}
