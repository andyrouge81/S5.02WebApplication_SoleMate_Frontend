import { clearToken, getToken } from "./auth";
import type {
  AdminUser,
  ArchType,
  AuthResponse,
  CurrentUser,
  Foot,
  MinigameLibraryResponse,
  PageResponse,
  Review,
  Swipe,
  SwipeAction,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiHttpError";
    this.status = status;
  }
}

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

    if (res.status === 401 && typeof window !== "undefined") {
      clearToken();
      const onAuthPage = window.location.pathname.startsWith("/login")
        || window.location.pathname.startsWith("/register");

      if (!onAuthPage) {
        window.location.href = "/login?reason=session-expired";
      }
    }

    throw new ApiHttpError(res.status, message);
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

export const getCurrentUserApi = () => request<CurrentUser>("/auth/me");

// Feet
export const getFeetApi = () => request<Foot[]>("/feet");

export const createFootApi = (data: {
  title: string;
  imageUrl: string;
  archType: ArchType;
}) =>
  request<Foot>("/feet", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const deleteFootApi = (footId: string | number) =>
  request<void>(`/feet/${footId}`, {
    method: "DELETE",
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

export const updateReviewApi = (
  reviewId: string | number,
  data: { rateAspect: number; comment: string }
) =>
  request<Review>(`/feet/reviews/${reviewId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteReviewApi = (reviewId: string | number) =>
  request<void>(`/feet/reviews/${reviewId}`, {
    method: "DELETE",
  });

// Swipes
export const saveFootSwipeApi = (
  footId: string | number,
  action: SwipeAction
) =>
  request<Swipe>(`/feet/${footId}/swipe`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });

export const getMySwipesApi = () => request<Swipe[]>("/feet/swipes/me");

export const getMinigameLibraryApi = async (folder?: string) => {
  const query = folder ? `?folder=${encodeURIComponent(folder)}` : "";
  const res = await fetch(`/api/minigame/library${query}`);
  if (!res.ok) {
    throw new Error("No se pudo cargar la librería del minijuego");
  }
  return (await res.json()) as MinigameLibraryResponse;
};

// Admin
export const getAdminUsersApi = (params?: {
  page?: number;
  size?: number;
  search?: string;
}) => {
  const page = params?.page ?? 0;
  const size = params?.size ?? 10;
  const search = params?.search?.trim();

  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  if (search) {
    query.set("search", search);
  }

  return request<PageResponse<AdminUser>>(`/admin/users?${query.toString()}`);
};

export const updateAdminUserApi = (
  userId: string | number,
  data: { email: string; role: "ROLE_USER" | "ROLE_ADMIN" }
) =>
  request<AdminUser>(`/admin/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteAdminUserApi = (userId: string | number) =>
  request<void>(`/admin/users/${userId}`, {
    method: "DELETE",
  });
