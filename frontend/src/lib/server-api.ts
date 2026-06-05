import { cookies } from "next/headers";
import { getApiUrl } from "./api";

const TOKEN_KEY = "siar_token";

async function getServerToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(TOKEN_KEY)?.value ?? null;
  } catch {
    return null;
  }
}

type RequestOptions = {
  headers?: Record<string, string>;
  params?: Record<string, string>;
};

async function request<T>(
  method: string,
  path: string,
  body?: FormData | unknown,
  options?: RequestOptions,
): Promise<T> {
  const token = await getServerToken();
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
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error de conexión" }));
    throw new Error(err.detail || `Error ${res.status}`);
  }

  return res.json();
}

export const serverApi = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, undefined, options),

  post: <T>(path: string, body?: FormData | unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),

  put: <T>(path: string, body?: FormData | unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),

  del: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),
};
