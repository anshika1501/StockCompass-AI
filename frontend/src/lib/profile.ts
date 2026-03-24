import { API_BASE } from "./api-base";
import { getToken } from "./portfolio-data";

export type ProfileUser = {
  id?: number;
  name: string;
  email?: string;
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
      Authorization: `Bearer ${token}`,
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
