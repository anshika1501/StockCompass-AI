import Navigation from '@/components/Navigation';
import GoldSilverClient from './GoldSilverClient';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function GoldSilverPage() {
  return (
    <div className="min-h-screen pb-20">
      <Navigation />
      <main className="container mx-auto px-4 mt-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
        <GoldSilverClient />
      </main>
    </div>
  );
}
