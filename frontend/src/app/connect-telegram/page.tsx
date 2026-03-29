import { Suspense } from "react";
import ConnectTelegramPage from "./ConnectTelegramPage";

export default function PageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#070a12] text-slate-400">
          Loading…
        </div>
      }
    >
      <ConnectTelegramPage />
    </Suspense>
  );
}
