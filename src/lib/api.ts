const API_URL = import.meta.env.VITE_API_URL;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

export type ApiResponse<T> = {
  code: string;
  message: string;
  data: T;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  fullName: string;
  role: string;
};

export type RegisterResponse = {
  userId: string;
  email: string;
};

async function request< T = unknown>(route: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  let fullRoute = route;
  if (!route.includes("api-version")) {
    fullRoute += route.includes("?") ? "&api-version=1.0" : "?api-version=1.0";
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    if (body instanceof FormData) {
      fetchOptions.body = body;
      delete fetchOptions.headers!["Content-Type"];
    } else {
      fetchOptions.body = JSON.stringify(body);
    }
  }

  const res = await fetch(`${API_URL}${fullRoute}`, fetchOptions);

  const data = await res.json();

  if (!res.ok) throw new Error(data?.message || "Lỗi khi gọi API");

  return data;
}

export const api = {
  get: <T>(route: string, headers?: Record<string, string>) => request<T>(route, { method: "GET", headers }),
  post: <T>(route: string, body?: any, headers?: Record<string, string>) => request<T>(route, { method: "POST", body, headers }),
  put: <T>(route: string, body?: any, headers?: Record<string, string>) => request<T>(route, { method: "PUT", body, headers }),
  delete: <T>(route: string, body?: any, headers?: Record<string, string>) => request<T>(route, { method: "DELETE", body, headers }),
};
