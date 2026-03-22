import { Suspense } from "react";
import { LoginClient } from "./LoginClient";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 relative overflow-hidden">
            <Suspense fallback={<div className="text-center">Loading...</div>}>
                <LoginClient />
            </Suspense>
        </div>
    );
}
