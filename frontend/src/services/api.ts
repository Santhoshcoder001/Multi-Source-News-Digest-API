import axios, { AxiosError } from 'axios';

const rawBase = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:3001');
const apiBaseUrl = rawBase.replace(/\/$/, '') + '/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000
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
    // detect likely CORS or backend unavailable
    if (axios.isAxiosError(error) && !error.response) {
      throw new Error('Backend unavailable or CORS blocked');
    }

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
    if (axios.isAxiosError(error) && !error.response) {
      throw new Error('Backend unavailable or CORS blocked');
    }

    throw enrichError(error, 'Failed to fetch topics');
  }
}

export async function fetchNewsCategory(category?: string) {
  try {
    const path = category ? `/news/${encodeURIComponent(category)}` : '/news';
    const response = await api.get(path);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && !error.response) {
      throw new Error('Backend unavailable or CORS blocked');
    }

    throw enrichError(error, 'Failed to fetch news');
  }
}

export async function checkHealth() {
  try {
    const healthUrl = apiBaseUrl.replace(/\/api$/, '') + '/health';
    const response = await rootApi.get(healthUrl, { timeout: 5000 });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      throw new Error('Health check timeout');
    }

    if (axios.isAxiosError(error) && !error.response) {
      throw new Error('Backend unavailable or CORS blocked');
    }

    throw enrichError(error, 'Failed to check health');
  }
}

export default api;