import axios from "axios";

const api = axios.create({
  // Uses the environment-specific API URL
  // Local development points to the local Express server,
  // while production can point to the deployed backend
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach the JWT to every API request when the user is logged in.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle authentication failures globally
// If the backend returns 401, remove the invalid/expired token
// & send the user back to the login page
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
