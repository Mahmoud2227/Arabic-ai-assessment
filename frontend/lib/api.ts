export const API_BASE_URL = "/api";

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("arabic_ai_token") : null;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("arabic_ai_token");
      localStorage.removeItem("arabic_ai_user");
      window.location.href = "/login";
    }
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "API request failed");
  }

  return response;
}
