const DEFAULT_LOCAL_API_BASE_URL = 'http://localhost:5000/api';
const DEFAULT_PRODUCTION_API_BASE_URL = 'https://agricentral-46o8.onrender.com/api';

export function getApiBaseUrl() {
  const configuredBaseUrl = process.env.REACT_APP_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;

    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return DEFAULT_PRODUCTION_API_BASE_URL;
    }
  }

  return DEFAULT_LOCAL_API_BASE_URL;
}