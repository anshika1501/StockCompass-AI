'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'compare_stocks';

export interface CompareStock {
    symbol: string;
    name: string;
}

export function useCompareStocks() {
    const [compareList, setCompareList] = useState<CompareStock[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setCompareList(JSON.parse(raw));
        } catch {
            setCompareList([]);
        }
    }, []);

    const save = useCallback((list: CompareStock[]) => {
        setCompareList(list);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch { }
    }, []);

    const addToCompare = useCallback((stock: CompareStock) => {
        setCompareList((prev) => {
            if (prev.find((s) => s.symbol === stock.symbol)) return prev;
            const next = [...prev, stock];
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { }
            return next;
        });
    }, []);

    const removeFromCompare = useCallback((symbol: string) => {
        setCompareList((prev) => {
            const next = prev.filter((s) => s.symbol !== symbol);
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { }
            return next;
        });
    }, []);

    const clearCompare = useCallback(() => {
        save([]);
    }, [save]);

    const isInCompare = useCallback(
        (symbol: string) => compareList.some((s) => s.symbol === symbol),
        [compareList]
    );

    return { compareList, addToCompare, removeFromCompare, clearCompare, isInCompare };
}
