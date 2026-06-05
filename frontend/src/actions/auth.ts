"use server";

import { cookies } from "next/headers";
import { getApiUrl } from "../lib/api";

const TOKEN_KEY = "siar_token";

export async function loginAction(email: string, password: string) {
  const form = new FormData();
  form.append("email", email);
  form.append("password", password);

  const res = await fetch(getApiUrl("/api/auth/login"), {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error de conexión" }));
    throw new Error(err.detail || "Error al iniciar sesión");
  }

  const data = await res.json();
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_KEY, data.access_token, {
    path: "/",
    sameSite: "lax",
    maxAge: 7 * 86400,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  return data.usuario;
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_KEY);
}
