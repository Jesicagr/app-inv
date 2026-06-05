import { getApiUrl } from "./api";

const TOKEN_KEY = "siar_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  window.location.href = "/login";
}

type RequestOptions = {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  signal?: AbortSignal;
};

async function request<T>(
  method: string,
  path: string,
  body?: FormData | unknown,
  options?: RequestOptions,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { ...options?.headers };

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";

  let url = getApiUrl(path);
  if (options?.params) {
    const qs = new URLSearchParams(options.params).toString();
    if (qs) url += "?" + qs;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  });

  if (res.status === 401) {
    redirectToLogin();
    throw new Error("Sesión expirada");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error de conexión" }));
    throw new Error(err.detail || `Error ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, undefined, options),

  post: <T>(path: string, body?: FormData | unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),

  put: <T>(path: string, body?: FormData | unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),

  del: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),
};
