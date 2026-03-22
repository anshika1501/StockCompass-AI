import Navigation from "@/components/Navigation";
import CompareStocksClient from "./CompareStocksClient";

export const dynamic = 'force-dynamic';

export default function ComparePage() {
    return (
        <div className="min-h-screen pb-20">
            <Navigation />
            <main className="container mx-auto px-4 mt-8">
                <CompareStocksClient />
            </main>
        </div>
    );
}
