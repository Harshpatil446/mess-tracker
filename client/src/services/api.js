import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:8080/api");

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor for adding auth token
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Auth Services
export const register = async (userData) => {
  const response = await api.post("/auth/register", userData);
  if (response.data) {
    localStorage.setItem("user", JSON.stringify(response.data));
  }
  return response.data;
};

export const login = async (userData) => {
  const response = await api.post("/auth/login", userData);
  if (response.data) {
    localStorage.setItem("user", JSON.stringify(response.data));
  }
  return response.data;
};

export const logout = async () => {
  localStorage.removeItem("user");
  return await api.post("/auth/logout");
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

// Mess Services
export const createMess = async (messData) => {
  const response = await api.post("/mess", messData);
  return response.data;
};

export const getCurrentMess = async () => {
  const response = await api.get("/mess/current");
  return response.data;
};

export const getMessHistory = async () => {
  const response = await api.get("/mess/history");
  return response.data;
};

export const updateMess = async (id, messData) => {
  const response = await api.patch(`/mess/${id}`, messData);
  return response.data;
};

export const updateMeal = async (id, date, mealData) => {
  const response = await api.patch(`/mess/${id}/meals/${date}`, mealData);
  return response.data;
};

export const deleteMess = async (id) => {
  const response = await api.delete(`/mess/${id}`);
  return response.data;
};

export const importMessCycles = async (data) => {
  const response = await api.post("/mess/import", { data });
  return response.data;
};

export default api;
