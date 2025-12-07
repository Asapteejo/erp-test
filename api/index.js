import axios from "axios";

// ✅ Use empty baseURL to let Vite proxy handle /api
const API = axios.create({
  baseURL: '', // Proxy will prepend /api
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  // 🔐 Optional: Attach localStorage token (overridden by fetchSchools)
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 🏫 Include schoolId for SaaS multi-tenant logic
  const schoolId =
    localStorage.getItem("selectedSchoolId") ||
    window.location.host.split(".")[0]; // e.g., "myschool"

  if (schoolId && !config.url.includes("auth")) {
    config.params = { ...config.params, schoolId };
  }

  return config;
});

export default API;
