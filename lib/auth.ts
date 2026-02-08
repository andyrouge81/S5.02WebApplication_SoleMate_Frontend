const TOKEN_KEY = "solemate_token";
const COOKIE_KEY = "token";
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 12; // 12h, alineado con el backend

const inBrowser = () => typeof window !== "undefined";

export const saveToken = (token: string) => {
  if (!inBrowser()) return;
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(token)}; path=/; max-age=${TOKEN_MAX_AGE_SECONDS}; samesite=lax`;
};

export const getToken = () => (inBrowser() ? localStorage.getItem(TOKEN_KEY) : null);

export const clearToken = () => {
  if (!inBrowser()) return;
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${COOKIE_KEY}=; path=/; max-age=0; samesite=lax`;
};
