import { getToken } from "./auth";
import type { AuthResponse, Foot, Review } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? getToken() : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const raw = await res.text();
  let data: unknown = null;

  try {
    data = raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    data = raw;
  }

  if (!res.ok) {
    const isRecord = (value: unknown): value is Record<string, unknown> =>
      typeof value === "object" && value !== null;

    const messageFromPayload =
      isRecord(data) && typeof data.message === "string" ? data.message : null;

    const message =
      messageFromPayload ??
      (typeof data === "string" ? data : "Error en la petición");
    throw new Error(message);
  }

  return data as T;
}

// Auth
export const loginApi = (username: string, password: string) =>
  request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

export const registerApi = (username: string, email: string, password: string) =>
  request<void>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });

// Feet
export const getFeetApi = () => request<Foot[]>("/feet");

export const createFootApi = (data: {
  nickname: string;
  imageUrl: string;
  archType: "PES_PLANUS" | "PES_RECTUS" | "PES_CAVUS";
}) =>
  request<Foot>("/feet", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getFootByIdApi = async (id: string | number) => {
  const all = await getFeetApi();
  return all.find((f) => String(f.id) === String(id)) ?? null;
};

// Reviews
export const getReviewsByFootApi = (footId: string | number) =>
  request<Review[]>(`/feet/${footId}/reviews`);

export const createReviewApi = (
  footId: string | number,
  data: { rateAspect: number; comment: string }
) =>
  request<Review>(`/feet/${footId}/reviews`, {
    method: "POST",
    body: JSON.stringify(data),
  });
