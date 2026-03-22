import Navigation from '@/components/Navigation';
import StocksTableClient from './StocksTableClient';
import { getNifty50Stocks } from '@/lib/stock-data';
import { ChevronLeft, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function StocksPage() {
    const stocks = await getNifty50Stocks();

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

                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Nifty 50
                        </span>
                        <h1 className="text-4xl font-bold font-headline">Nifty 50 Stocks</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Live data for all 50 constituents of the NSE Nifty 50 index — key metrics, PE analysis, and comparison tools.
                    </p>
                </div>

                <StocksTableClient stocks={stocks} />
            </main>
        </div>
    );
}
