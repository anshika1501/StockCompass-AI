import { API_BASE } from "./api-base";

export interface Holding {
  id: number;
  portfolio: number;
  ticker: string;
  company_name: string;
  quantity: number;
  buy_price: number;
  buy_time: string;
}

export interface Portfolio {
  id: number;
  user: number;
  name: string;
  created_at: string;
  holdings: Holding[];
}

export function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("stock_compass_token") : null;
}

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const data = await res.json();
      msg = data.error || data.detail || JSON.stringify(data);
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function getPortfolios(): Promise<Portfolio[]> {
  const res = await fetch(`${API_BASE}/portfolio/`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Portfolio[]>(res);
}

export async function createPortfolio(name: string): Promise<Portfolio> {
  const res = await fetch(`${API_BASE}/portfolio/create/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name }),
  });
  return handleResponse<Portfolio>(res);
}

export async function addHolding(
  portfolio_id: number,
  ticker: string,
  company_name: string,
  quantity: number,
  buy_price: number
): Promise<Holding> {
  const res = await fetch(`${API_BASE}/holding/add/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ portfolio_id, ticker, company_name, quantity, buy_price }),
  });
  return handleResponse<Holding>(res);
}

export async function deleteHolding(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/holding/delete/${id}/`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const data = await res.json();
      msg = data.error || data.detail || JSON.stringify(data);
    } catch {}
    throw new Error(msg);
  }
}

export async function deletePortfolio(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/portfolio/${id}/delete/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const data = await res.json();
      msg = data.error || data.detail || JSON.stringify(data);
    } catch {}
    throw new Error(msg);
  }
}

export async function renamePortfolio(id: number, name: string): Promise<Portfolio> {
  const res = await fetch(`${API_BASE}/portfolio/${id}/rename/`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name }),
  });
  return handleResponse<Portfolio>(res);
}

export interface LiveSearchStock {
  symbol: string;
  company_name: string;
  current_price: number;
  currency: string;
}

export async function searchLiveStocks(query: string): Promise<LiveSearchStock[]> {
  const res = await fetch(`${API_BASE}/stocks/live-search/?q=${encodeURIComponent(query)}&limit=8`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<LiveSearchStock[]>(res);
}
