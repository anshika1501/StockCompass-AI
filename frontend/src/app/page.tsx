import Navbar from "@/components/home/Navbar";
import Hero from "@/components/home/Hero";
import TrustStrip from "@/components/home/TrustStrip";
import Features from "@/components/home/Features";
import LivePreview from "@/components/home/LivePreview";
import HowItWorks from "@/components/home/HowItWorks";

import Footer from "@/components/home/Footer";
import ChatbotButton from "@/components/home/ChatbotButton";

export default function Home() {
  return (
    <main className="landing-page relative min-h-screen overflow-x-hidden bg-[#070a12] font-body text-white selection:bg-indigo-500/25 selection:text-indigo-100">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.4]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.22), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(59, 130, 246, 0.12), transparent), radial-gradient(ellipse 50% 30% at 0% 100%, rgba(99, 102, 241, 0.08), transparent)",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[length:72px_72px] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_40%,#000_35%,transparent_100%)]"
        aria-hidden
      />
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <TrustStrip />
        <Features />
        <LivePreview />
        <HowItWorks />
        <Footer />
        <ChatbotButton />
      </div>
    </main>
  );
}
