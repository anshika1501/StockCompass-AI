import { Suspense } from "react";
import { AuthScreen } from "@/components/auth/AuthScreen";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#070a12] text-slate-400">
          Loading…
        </div>
      }
    >
      <AuthScreen />
    </Suspense>
  );
}
