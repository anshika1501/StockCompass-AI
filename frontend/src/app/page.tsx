import TickerBar from "@/components/home/TickerBar";
import Navbar from "@/components/home/Navbar";
import Hero from "@/components/home/Hero";
import PlatformSystem from "@/components/home/PlatformSystem";
import Footer from "@/components/home/Footer";
import ChatbotButton from "@/components/home/ChatbotButton";

export default function Home() {
  return (
    <main className="landing-page relative min-h-screen overflow-x-hidden bg-[#070a12] font-body text-white selection:bg-indigo-500/25 selection:text-indigo-100">
      {/* Ambient background glows — fixed so they span the entire page */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.45]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.22), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(59,130,246,0.1), transparent), radial-gradient(ellipse 50% 30% at 0% 100%, rgba(99,102,241,0.07), transparent), radial-gradient(ellipse 40% 30% at 80% 80%, rgba(124,58,237,0.06), transparent)",
        }}
      />
      {/* Grid texture */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[length:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_10%,#000_30%,transparent_100%)] opacity-30"
        aria-hidden
      />

      {/* TickerBar is fixed-positioned (z-[60]) — mount here to render at top of the page */}
      <TickerBar />
      {/* Spacer = ticker bar height (36px) so page content doesn't slide under it */}
      <div className="h-[36px]" />


      <div className="relative z-10">
        <Navbar />
        <Hero />
        <PlatformSystem />
        <Footer />
        <ChatbotButton />
      </div>
    </main>
  );
}
