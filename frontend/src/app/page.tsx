import Navbar from "@/components/home/Navbar";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import LivePreview from "@/components/home/LivePreview";
import HowItWorks from "@/components/home/HowItWorks";
import Testimonials from "@/components/home/Testimonials";
import CTA from "@/components/home/CTA";
import Footer from "@/components/home/Footer";
import ChatbotButton from "@/components/home/ChatbotButton";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B0F19] text-white font-body overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />
      <Hero />
      <Features />
      <LivePreview />
      <HowItWorks />
      <Testimonials />
      <CTA />
      <Footer />
      <ChatbotButton />
    </main>
  );
}
