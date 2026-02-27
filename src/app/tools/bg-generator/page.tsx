import { MithrilAuthGate } from "@/components/Mithril/auth";
import BgGeneratorPage from "@/components/Tools/BgGenerator/BgGeneratorPage";
import { Suspense } from "react";

export default function BgGeneratorToolPage() {
  return (
    <MithrilAuthGate>
      <Suspense fallback={<div className="p-8 text-zinc-400">Loading...</div>}>
        <BgGeneratorPage />
      </Suspense>
    </MithrilAuthGate>
  );
}
