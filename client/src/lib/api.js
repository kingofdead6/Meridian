import axios from 'axios';

export const TOKEN_KEY = 'meridian_token';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/')) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (e) => e?.response?.data?.message || e?.message || 'Something went wrong';

export async function uploadFile(file, folder = 'files') {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);
  const { data } = await api.post('/uploads', form);
  return data;
}

/** Fetches an authenticated PDF and opens it in a new tab. */
export async function openPdf(path) {
  const { data } = await api.get(path, { responseType: 'blob' });
  const url = URL.createObjectURL(data);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export default api;
