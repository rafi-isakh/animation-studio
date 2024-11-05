import { CircularProgress } from "@mui/material";
import Lottie from "lottie-react";
import animationData from "../../public/N_logo_loader.json";

// interface LoadingProps {
//     useLottie?: boolean;
// }

  export default function Loading() {
    console.log('Animation data:', animationData);

    return (
      <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
        {/* {useLottie ? ( */}
          // Lottie Animation
          <div className="w-32 border border-red-500"> {/* Added border to see container */}
            <Lottie
              animationData={animationData}
              className="w-full h-full"  // Modified classes
              loop={true}
              autoplay={true}  // Added autoplay
              rendererSettings={{
                preserveAspectRatio: 'xMidYMid slice'
              }}
            />
          </div>
        {/* // ) : (
        //     // Default Spinner
        //     <div role="status">
        //     <CircularProgress color="secondary" />
        //     <span className="sr-only">Loading...</span>
        //     </div>
        //   )} */}
  </div>
);
}