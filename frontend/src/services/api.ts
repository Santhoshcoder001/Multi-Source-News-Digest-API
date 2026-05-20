import axios, { AxiosError } from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

const api = axios.create({
  baseURL: apiBaseUrl
});

const rootApi = axios.create();

api.interceptors.request.use((config) => {
  const apiKey = import.meta.env.VITE_API_KEY;

  if (apiKey) {
    config.headers = config.headers ?? {};
    config.headers['x-api-key'] = apiKey;
  }

  return config;
});

function enrichError(error: unknown, fallbackMessage: string): Error {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    const message = axiosError.response?.data?.message
      ?? axiosError.response?.data?.error
      ?? axiosError.message
      ?? fallbackMessage;

    const friendlyError = new Error(message);
    (friendlyError as Error & { status?: number }).status = axiosError.response?.status;
    return friendlyError;
  }

  return new Error(fallbackMessage);
}

export async function fetchDigest(params: { sentiment?: string; limit?: number; date?: string } = {}) {
  try {
    const response = await api.get('/digest', { params });
    return response.data;
  } catch (error) {
    throw enrichError(error, 'Failed to fetch digest');
  }
}

export async function fetchTopic(name: string) {
  try {
    const response = await api.get(`/topic/${encodeURIComponent(name)}`);
    return response.data;
  } catch (error) {
    throw enrichError(error, 'Failed to fetch topic');
  }
}

export async function fetchTopics() {
  try {
    const response = await api.get('/topics');
    return response.data;
  } catch (error) {
    throw enrichError(error, 'Failed to fetch topics');
  }
}

export async function checkHealth() {
  try {
    const response = await rootApi.get(`${apiBaseUrl.replace(/\/api$/, '')}/health`);
    return response.data;
  } catch (error) {
    throw enrichError(error, 'Failed to check health');
  }
}

export default api;