import axios from "axios";

// Environment variable se API URL uthayega, warna fallback URL use karega
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://be-travel-beckend.vercel.app",
  withCredentials: true,
});

export default API;
