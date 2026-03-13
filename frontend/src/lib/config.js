const fallbackApi = "https://scapp-64qg.onrender.com";
const rawApiUrl = (import.meta.env?.VITE_API_BASE_URL) || fallbackApi;

export const API_BASE_URL = rawApiUrl.replace(/\/+$/, "");
export const GOOGLE_AUTH_URL = `${API_BASE_URL}/oauth2/authorization/google`;
