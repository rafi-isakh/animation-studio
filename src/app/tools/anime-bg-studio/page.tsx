import { Suspense } from "react";
import MithrilAuthGate from "@/components/Mithril/auth/MithrilAuthGate";
import AnimeBgStudioPage from "@/components/Tools/AnimeBgStudio/AnimeBgStudioPage";

export default function AnimeBgStudioToolPage() {
  return (
    <MithrilAuthGate>
      <Suspense fallback={<div className="p-8 text-zinc-400">Loading...</div>}>
        <AnimeBgStudioPage />
      </Suspense>
    </MithrilAuthGate>
  );
}
