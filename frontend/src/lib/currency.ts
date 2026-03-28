export const USD_TO_INR = 94;
const USD_TO_INR_TTL_MS = 6 * 60 * 60 * 1000;
let cachedUsdToInr = USD_TO_INR;
let lastUsdToInrFetch = 0;
let inFlightUsdToInr: Promise<number> | null = null;

export const INR_TO_USD = 1 / USD_TO_INR;
let cachedInrToUsd = INR_TO_USD;
let lastInrToUsdFetch = 0;
let inFlightInrToUsd: Promise<number> | null = null;

export async function getUsdToInrRate(): Promise<number> {
    const now = Date.now();
    if (now - lastUsdToInrFetch < USD_TO_INR_TTL_MS) {
        return cachedUsdToInr;
    }
    if (inFlightUsdToInr) {
        return inFlightUsdToInr;
    }
    inFlightUsdToInr = (async () => {
        try {
            const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=INR", {
                cache: "no-store",
            });
            if (!res.ok) throw new Error("Rate fetch failed");
            const data = await res.json();
            const rate = Number(data?.rates?.INR);
            if (Number.isFinite(rate) && rate > 0) {
                cachedUsdToInr = rate;
                lastUsdToInrFetch = Date.now();
            }
        } catch {
            // Keep last known rate on failure.
        } finally {
            inFlightUsdToInr = null;
        }
        return cachedUsdToInr;
    })();
    return inFlightUsdToInr;
}

export async function getInrToUsdRate(): Promise<number> {
    const now = Date.now();
    if (now - lastInrToUsdFetch < USD_TO_INR_TTL_MS) {
        return cachedInrToUsd;
    }
    if (inFlightInrToUsd) {
        return inFlightInrToUsd;
    }
    inFlightInrToUsd = (async () => {
        try {
            const res = await fetch("https://api.frankfurter.app/latest?from=INR&to=USD", {
                cache: "no-store",
            });
            if (!res.ok) throw new Error("Rate fetch failed");
            const data = await res.json();
            const rate = Number(data?.rates?.USD);
            if (Number.isFinite(rate) && rate > 0) {
                cachedInrToUsd = rate;
                lastInrToUsdFetch = Date.now();
            }
        } catch {
            // Keep last known rate on failure.
        } finally {
            inFlightInrToUsd = null;
        }
        return cachedInrToUsd;
    })();
    return inFlightInrToUsd;
}

export function isUsd(currency?: string, country?: string): boolean {
    const cur = (currency || "").toUpperCase();
    if (cur === "USD") return true;
    const ctry = (country || "").toLowerCase();
    return ctry === "usa" || ctry === "united states" || ctry === "united states of america";
}

export function formatMoney(
    value: number | null | undefined,
    currency?: string,
    country?: string,
    options: Intl.NumberFormatOptions = { maximumFractionDigits: 2 }
): string {
    if (value == null || Number.isNaN(value)) return "-";
    if (isUsd(currency, country)) {
        return `$${value.toLocaleString("en-US", options)}`;
    }
    return `₹${value.toLocaleString("en-IN", options)}`;
}

export function toInrFromUsd(value: number, rate: number = cachedUsdToInr): number {
    return value * rate;
}

export function toUsdFromInr(value: number, rate: number = cachedInrToUsd): number {
    return value * rate;
}

export function formatInr(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return "-";
    return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatUsd(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return "-";
    return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}
