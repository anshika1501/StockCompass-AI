import { API_BASE } from "./api-base";
import { getToken } from "./portfolio-data";

  export type ProfileUser = {
  id?: number;
  name: string;
  email?: string;
  date_joined?: string;
};

export async function updateProfile(payload: {
  name?: string;
  email?: string;
}): Promise<ProfileUser> {
  const token = getToken();
  if (!token) throw new Error("Not signed in");

  const res = await fetch(`${API_BASE}/profile/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      // Standard DRF token header
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const data = await res.json();
      msg = data.error || data.detail || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const data = await res.json();
  return data.user as ProfileUser;
}

export type UserSettings = {
  has_mpin: boolean;
  telegram_id: string;
};

export async function getUserSettings(): Promise<UserSettings> {
  const token = getToken();
  if (!token) throw new Error("Not signed in");
  const res = await fetch(`${API_BASE}/settings/`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!res.ok) throw new Error("Could not fetch settings");
  return await res.json();
}

export async function updateUserSettings(payload: any): Promise<{message: string; telegram_id?: string}> {
  const token = getToken();
  if (!token) throw new Error("Not signed in");
  const res = await fetch(`${API_BASE}/settings/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = "Error updating settings";
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return await res.json();
}
