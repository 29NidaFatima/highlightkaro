import { API_BASE_URL } from "../config/api";

/**
 * fetch() wrapper for authenticated API calls.
 * Adds the bearer token and, when the access token has expired, tries the
 * refresh cookie once before giving up. AuthContext listens for the
 * "hk:auth" event to keep React state in sync.
 */

const emitAuth = (detail) => window.dispatchEvent(new CustomEvent("hk:auth", { detail }));

let refreshInFlight = null;

export async function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        if (!data?.token) return null;
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        emitAuth({ type: "refreshed", token: data.token, user: data.user });
        return data;
      })
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export async function apiFetch(path, options = {}) {
  const doFetch = () => {
    const token = localStorage.getItem("token");
    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  };

  let res = await doFetch();
  if (res.status === 401 && localStorage.getItem("token")) {
    const refreshed = await refreshSession();
    if (refreshed) {
      res = await doFetch();
    } else {
      emitAuth({ type: "expired" });
    }
  }
  return res;
}
