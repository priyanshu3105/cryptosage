import type { ApiError } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export type ReplayWarning = {
  code:
    | "INVALID_JOURNAL_TRADE"
    | "INVALID_BUY"
    | "INVALID_SELL"
    | "SELL_EXCEEDS_HOLDINGS";
  message: string;
  offendingLogId?: string;
  offendingCreatedAt?: string;
  offendingSymbol?: string;
};

export type ApiEnvelope<T> = {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    hasMore?: boolean;
    source?: string;
    limit?: number;
    range?: string;
    replayWarning?: ReplayWarning;
  };
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = { message: "An error occurred", status: response.status };
      try {
        const body = await response.json();
        error.message = body?.error?.message || error.message;
        error.code = body?.error?.code;
      } catch {
        // ignore parse errors
      }
      throw error;
    }

    return response.json() as Promise<T>;
  }

  get<T>(endpoint: string) {
    return this.request<ApiEnvelope<T>>(endpoint).then((r) => r.data);
  }

  getWithMeta<T>(endpoint: string) {
    return this.request<ApiEnvelope<T>>(endpoint);
  }

  post<T>(endpoint: string, data?: unknown) {
    return this.request<ApiEnvelope<T>>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }).then((r) => r.data);
  }

  postWithMeta<T>(endpoint: string, data?: unknown) {
    return this.request<ApiEnvelope<T>>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown) {
    return this.request<ApiEnvelope<T>>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }).then((r) => r.data);
  }

  putWithMeta<T>(endpoint: string, data?: unknown) {
    return this.request<ApiEnvelope<T>>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string) {
    return this.request<ApiEnvelope<T>>(endpoint, { method: "DELETE" }).then((r) => r.data);
  }

  deleteWithMeta<T>(endpoint: string) {
    return this.request<ApiEnvelope<T>>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
