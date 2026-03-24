"use client";

import { useEffect, useState } from "react";

/** Compact market status strip for sector hub — user greeting lives in DashboardTopBar */
export default function UserBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("stock_compass_user");
    setShow(!!raw);
  }, []);

  if (!show) return null;

  return (
    <div className="mb-8 flex justify-end">
      <div className="rounded-xl border border-slate-200/90 bg-white px-5 py-3 shadow-sm">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#4F8DF7]">
          Market data
        </p>
        <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-emerald-800">
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.45)]"
            aria-hidden
          />
          Live feed · Connected
        </p>
      </div>
    </div>
  );
}
