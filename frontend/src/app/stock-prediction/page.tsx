import Navigation from "@/components/Navigation";
import StockPredictionClient from "./StockPredictionClient";

export const metadata = {
    title: "Stock Prediction | StockCompass",
    description: "Predict stock prices using ML models",
};

export default function StockPredictionPage() {
    return (
        <main className="min-h-screen bg-background">
            <Navigation />
            <StockPredictionClient />
        </main>
    );
}
