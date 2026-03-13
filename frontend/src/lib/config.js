const fallbackApi = "http://localhost:8080";
const rawApiUrl = (import.meta.env?.VITE_API_BASE_URL) || fallbackApi;

export const API_BASE_URL = rawApiUrl.replace(/\/+$/, "");
export const GOOGLE_AUTH_URL = `${API_BASE_URL}/oauth2/authorization/google`;
