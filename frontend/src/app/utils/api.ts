const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: Error) => void }> = [];

function processRefreshQueue(token: string | null, error: Error | null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  refreshQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${refreshToken}`,
    },
  });

  if (!response.ok) {
    // Refresh token is invalid/expired — force logout
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    window.location.reload();
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json();
  const newToken = data.data.access_token;
  localStorage.setItem("token", newToken);
  return newToken;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token && token !== "undefined" && token !== "null") {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 — attempt token refresh and retry
  if (response.status === 401 && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/signup") && !endpoint.includes("/auth/refresh")) {
    if (isRefreshing) {
      // Another refresh is in progress — queue this request
      return new Promise<any>((resolve, reject) => {
        refreshQueue.push({
          resolve: async (newToken: string) => {
            headers["Authorization"] = `Bearer ${newToken}`;
            try {
              const retryResponse = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
              const retryData = await retryResponse.json();
              if (!retryResponse.ok) {
                reject(new Error(retryData.message || retryData.error || "An error occurred"));
              }
              resolve(retryData);
            } catch (err) {
              reject(err);
            }
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const newToken = await refreshAccessToken();
      processRefreshQueue(newToken, null);
      
      // Retry the original request with new token
      headers["Authorization"] = `Bearer ${newToken}`;
      const retryResponse = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
      const retryData = await retryResponse.json();
      if (!retryResponse.ok) {
        throw new Error(retryData.message || retryData.error || "An error occurred");
      }
      return retryData;
    } catch (err) {
      processRefreshQueue(null, err as Error);
      throw err;
    } finally {
      isRefreshing = false;
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || "An error occurred");
  }

  return data;
}

export async function downloadCsv(endpoint: string, filename = "export.csv") {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};
  if (token && token !== "undefined" && token !== "null") {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, { headers });
  if (!response.ok) {
    throw new Error("Failed to export report");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

