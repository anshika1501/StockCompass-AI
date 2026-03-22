"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import { Briefcase, BarChart2, Activity, GitCompare, Bitcoin, ArrowRight, BrainCircuit, Database, Server, Layout } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AnimatedHeroChart from "@/components/AnimatedHeroChart";

export default function Home() {
  const [user, setUser] = useState<{ name: string, email: string } | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const checkAuth = () => {
      const storedUser = localStorage.getItem("stock_compass_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem("stock_compass_user");
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    checkAuth();
    window.addEventListener("auth_change", checkAuth);
    
    return () => {
      window.removeEventListener("auth_change", checkAuth);
    };
  }, []);
  const cards = [
    {
      title: "Portfolios",
      description: "Access curated industry portfolios and track performance.",
      icon: Briefcase,
      href: "/portfolios",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      title: "Nifty 50",
      description: "Real-time metrics and insights for top 50 Indian companies.",
      icon: BarChart2,
      href: "/stocks",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      title: "Stock Analysis",
      description: "Advanced PCA and K-Means clustering for Nifty 50 stocks.",
      icon: Activity,
      href: "/nifty50-pca",
      color: "text-indigo-500",
      bg: "bg-indigo-500/10"
    },
    {
      title: "Compare",
      description: "Side-by-side comparison of multiple stocks and metrics.",
      icon: GitCompare,
      href: "/compare",
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    },
    {
      title: "Bitcoin, Gold & Silver",
      description: "Live prices, predictive trajectory, and ML forecasting.",
      icon: Bitcoin,
      href: "/gold-silver",
      color: "text-rose-500",
      bg: "bg-rose-500/10"
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation />

      <main className="container mx-auto px-4 mt-20 max-w-6xl">
        <section className="text-center mb-10 md:mb-20 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
          <h1 className="text-5xl md:text-7xl font-bold font-headline text-primary mb-6 tracking-tight relative z-10">
            Navigate the markets with <span className="text-accent text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">StockCompass</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto relative z-10 mb-12">
            Your all-in-one platform for AI-powered market insights, advanced stock clustering, and predictive trajectory forecasting.
          </p>

          {isClient && !user && (
            <div className="max-w-4xl mx-auto w-full relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <AnimatedHeroChart />
            </div>
          )}
        </section>

        {isClient && !user && (
          <div className="mt-24 mb-16 relative z-10 border-t pt-16 border-primary/10">
            <h2 className="text-3xl text-center font-bold font-headline text-primary mb-12">Platform Capabilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cards.map((card, idx) => (
                <div key={idx} className="flex flex-col items-center text-center p-6 bg-white/40 rounded-3xl border border-primary/5 shadow-sm backdrop-blur-sm">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${card.bg}`}>
                    <card.icon className={`h-7 w-7 ${card.color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{card.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{card.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-24 border-t pt-16 border-primary/10">
              <h2 className="text-3xl text-center font-bold font-headline text-primary mb-12">Technology Stack & Architecture</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex flex-col items-center text-center p-6 bg-white/40 rounded-3xl border border-primary/5 shadow-sm backdrop-blur-sm">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-purple-500/10">
                    <BrainCircuit className="h-6 w-6 text-purple-500" />
                  </div>
                  <h3 className="font-bold mb-2">Machine Learning</h3>
                  <p className="text-sm text-muted-foreground">Scikit-learn PCA &amp; K-Means clustering with predictive forecasting</p>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-white/40 rounded-3xl border border-primary/5 shadow-sm backdrop-blur-sm">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-orange-500/10">
                    <Database className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="font-bold mb-2">Live Market Data</h3>
                  <p className="text-sm text-muted-foreground">Real-time integration with Yahoo Finance (yfinance) APIs</p>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-white/40 rounded-3xl border border-primary/5 shadow-sm backdrop-blur-sm">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-blue-500/10">
                    <Server className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="font-bold mb-2">Robust Backend</h3>
                  <p className="text-sm text-muted-foreground">Django REST Framework executing powerful Python analytics</p>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-white/40 rounded-3xl border border-primary/5 shadow-sm backdrop-blur-sm">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-cyan-500/10">
                    <Layout className="h-6 w-6 text-cyan-500" />
                  </div>
                  <h3 className="font-bold mb-2">Modern Frontend</h3>
                  <p className="text-sm text-muted-foreground">Next.js React application powered by Tailwind CSS &amp; TypeScript</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isClient && user && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {cards.map((card, idx) => (
            <Link key={idx} href={card.href} className="block group">
              <Card className="h-full hover:shadow-xl transition-all duration-300 hover:border-primary/40 relative overflow-hidden bg-white/60 backdrop-blur-md">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${card.bg}`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-muted-foreground mb-6">
                    {card.description}
                  </CardDescription>
                  <div className="flex items-center text-sm font-semibold text-primary mt-auto">
                    Explore <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        )}
      </main>
    </div>
  );
}
