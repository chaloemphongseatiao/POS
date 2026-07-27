import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("pos_token") ?? sessionStorage.getItem("pos_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    const { useLoading } = require("@/lib/hooks/useLoading");
    useLoading.getState().inc();
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (typeof window !== "undefined") {
      const { useLoading } = require("@/lib/hooks/useLoading");
      useLoading.getState().dec();
    }
    return response;
  },
  (error) => {
    if (typeof window !== "undefined") {
      const { useLoading } = require("@/lib/hooks/useLoading");
      useLoading.getState().dec();
    }
    if (typeof window !== "undefined") {
      const status = error.response?.status;
      const message = error.response?.data?.message ?? error.message ?? "เกิดข้อผิดพลาด";

      if (status === 401) {
        const { useAuth } = require("@/lib/hooks/useAuth");
        useAuth.getState().logout();
        window.location.href = "/login";
      } else {
        const { useToast } = require("@/lib/hooks/useToast");
        useToast.getState().addToast(message, "error");
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
