import { Suspense } from "react";
import ForgotPasswordContent from "./ForgotPasswordContent";

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#070a12] text-slate-400">
          Loading…
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
