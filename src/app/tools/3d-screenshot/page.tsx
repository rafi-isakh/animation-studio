import { Suspense } from "react";
import MithrilAuthGate from "@/components/Mithril/auth/MithrilAuthGate";
import ThreeDScreenshotPage from "@/components/Tools/3dScreenshot/3dScreenshotPage";

export default function ThreeDScreenshotToolPage() {
  return (
    <MithrilAuthGate>
      <Suspense fallback={<div className="p-8 text-zinc-400">Loading...</div>}>
        <ThreeDScreenshotPage />
      </Suspense>
    </MithrilAuthGate>
  );
}
