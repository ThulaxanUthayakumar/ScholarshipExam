import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15000,
});
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("scholarship-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export const errorText = (e) =>
  e.response?.data?.detail ||
  e.response?.data?.title ||
  "இணைப்பில் சிக்கல். மீண்டும் முயற்சிக்கவும்.";
export async function getPilotPackage(signal) {
  return (await api.get("/public/package", { signal })).data;
}
