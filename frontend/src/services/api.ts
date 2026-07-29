const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://devconnect-11qm.onrender.com/api');

interface RequestOptions extends RequestInit {
  token?: string | null;
}

export class ApiError extends Error {
  status: number;
  errors?: any[];
  constructor(message: string, status: number, errors?: any[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

const onRefreshed = (token: string | null) => {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb: (token: string | null) => void) => {
  refreshSubscribers.push(cb);
};

/**
 * Perform a secure fetch request to the backend
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers = {}, ...restOptions } = options;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // If a valid JWT token is provided or stored in localStorage, attach it
  const authToken = (token && token !== 'cookie-based') ? token : localStorage.getItem('dc_token');
  if (authToken && authToken !== 'cookie-based') {
    defaultHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  const config: RequestInit = {
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...(headers as Record<string, string>),
    },
    ...restOptions,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  let data;
  try {
    data = await response.json();
  } catch (err) {
    // Graceful backup for empty or non-JSON payloads
    data = {};
  }

  if (!response.ok) {
    // Intercept 401/403 Unauthorized/Forbidden and attempt to refresh the token
    if ((response.status === 401 || response.status === 403) && endpoint !== '/auth/login' && endpoint !== '/auth/refresh' && endpoint !== '/auth/logout') {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!refreshRes.ok) {
            throw new Error('Refresh token expired or invalid');
          }
          
          // Successful refresh updates HTTP-only cookies
          onRefreshed('cookie-based');
          return request<T>(endpoint, options);
        } catch (err) {
          onRefreshed(null);
          localStorage.removeItem('dc_token');
          throw new ApiError('Session expired. Please log in again.', 401);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Queue the request while the token is being refreshed
        return new Promise<T>((resolve, reject) => {
          addRefreshSubscriber((newToken) => {
            if (newToken) {
              resolve(request<T>(endpoint, options));
            } else {
              reject(new ApiError('Session expired. Please log in again.', 401));
            }
          });
        });
      }
    }
    
    throw new ApiError(data.message || 'Something went wrong', response.status, data.errors);
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { method: 'GET', ...options }),

  post: <T>(endpoint: string, body: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    }),

  put: <T>(endpoint: string, body: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { method: 'DELETE', ...options }),
};
