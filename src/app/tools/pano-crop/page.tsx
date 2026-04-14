import { Suspense } from "react";
import MithrilAuthGate from "@/components/Mithril/auth/MithrilAuthGate";
import PanoCropPage from "@/components/Tools/PanoCrop/PanoCropPage";

export default function PanoCropToolPage() {
  return (
    <MithrilAuthGate>
      <Suspense
        fallback={<div className="p-8 text-zinc-400">Loading...</div>}
      >
        <PanoCropPage />
      </Suspense>
    </MithrilAuthGate>
  );
}
