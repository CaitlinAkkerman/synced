const API_URL = import.meta.env.VITE_API_URL || '';

export async function apiCall(endpoint, options = {}) {
  // Use relative URL so Vite proxy handles it
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  
  return response;
}

export { API_URL };