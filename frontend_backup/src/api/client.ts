import axios from "axios";
import type { AuthSession, AuthUser } from "../components/auth/auth.types";
import type { ChatRequest, ChatResponse } from "../features/chat/chat.types";

const http = axios.create({
  // Use relative base URL so Vite dev proxy (`/api` -> http://localhost:4000)
  // and production deployments on the same origin both work.
  baseURL: "/api",
  timeout: 8000,
});

let authToken: string | null = null;

http.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("cs:unauthorized"));
    }

    return Promise.reject(error);
  }
);

type ApiEnvelope<T> = {
  data: T;
  meta?: {
    source?: string;
    limit?: number;
    range?: string;
  };
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
};

type AuthCredentials = {
  email: string;
  password: string;
};

type RegisterInput = AuthCredentials & {
  name: string;
};

type MarketCoin = {
  id: string;
  symbol: string;
  name: string;
  image: string | null;
  price: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
};

type MarketHistoryPoint = {
  timestamp: string;
  price: number;
};

type CoinHistory = {
  coinId: string;
  range: string;
  prices: MarketHistoryPoint[];
  marketCaps: Array<{ timestamp: string; marketCap: number }>;
  volumes: Array<{ timestamp: string; volume: number }>;
};

type DefiProtocolSummary = {
  name: string;
  slug: string;
  tvl: number;
  category: string | null;
  chains: string[];
};

type DefiProtocolDetail = {
  name: string;
  slug: string;
  category: string | null;
  chains: string[];
  tvl: number;
  description: string | null;
  url: string | null;
  twitter: string | null;
  audits: number | null;
  auditNote: string | null;
};

type DefiProtocolTvl = {
  slug: string;
  range: string;
  tvl: Array<{ timestamp: string; tvl: number }>;
};

type PortfolioHolding = {
  _id: string;
  coinId: string;
  symbol: string | null;
  name: string | null;
  quantity: number;
  buyPrice: number;
  addedAt: string;
};

type Portfolio = {
  _id: string;
  id?: string;
  user: string;
  name: string;
  holdings: PortfolioHolding[];
  createdAt: string;
  updatedAt: string;
};

export const api = {
  setToken: (token: string | null) => {
    authToken = token;
  },

  register: (input: RegisterInput) =>
    http.post<ApiEnvelope<AuthUser>>("/auth/register", input).then((r) => r.data),
  login: (input: AuthCredentials) =>
    http.post<ApiEnvelope<AuthSession>>("/auth/login", input).then((r) => r.data),
  getMe: () => http.get<ApiEnvelope<AuthUser>>("/auth/me").then((r) => r.data),
  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    http.post<ApiEnvelope<{ message: string }>>("/auth/change-password", input).then((r) => r.data),
  deleteMe: () => http.delete<ApiEnvelope<{ message: string }>>("/auth/me").then((r) => r.data),

  // Market (CoinGecko-backed)
  getTopCoins: (limit: number = 50) =>
    http.get<ApiEnvelope<MarketCoin[]>>("/market/top", { params: { limit } }).then((r) => r.data),
  getCoinPrice: (id: string) =>
    http.get(`/market/price/${id}`).then((r) => r.data),
  getCoinHistory: (id: string, range: string = "7d") =>
    http.get<ApiEnvelope<CoinHistory>>(`/market/history/${id}`, { params: { range } }).then((r) => r.data),

  // DeFi (DefiLlama-backed)
  getDefiProtocols: (limit: number = 15) =>
    http.get<ApiEnvelope<DefiProtocolSummary[]>>("/defi/protocols", { params: { limit } }).then((r) => r.data),
  getDefiProtocol: (slug: string) =>
    http.get<ApiEnvelope<DefiProtocolDetail>>(`/defi/protocols/${slug}`).then((r) => r.data),
  getDefiProtocolTVL: (slug: string, range: string = "90d") =>
    http.get<ApiEnvelope<DefiProtocolTvl>>(`/defi/protocols/${slug}/tvl`, { params: { range } }).then((r) => r.data),

  getPortfolio: () => http.get<ApiEnvelope<Portfolio>>("/portfolio").then((r) => r.data),
  createPortfolio: (input: { name?: string }) =>
    http.post<ApiEnvelope<Portfolio>>("/portfolio", input).then((r) => r.data),
  updatePortfolio: (input: { name: string }) =>
    http.put<ApiEnvelope<Portfolio>>("/portfolio", input).then((r) => r.data),
  addHolding: (input: {
    coinId: string;
    quantity: number;
    buyPrice: number;
    symbol?: string;
    name?: string;
  }) => http.post<ApiEnvelope<Portfolio>>("/portfolio/holdings", input).then((r) => r.data),
  updateHolding: (
    holdingId: string,
    input: {
      quantity?: number;
      buyPrice?: number;
      symbol?: string;
      name?: string;
    }
  ) => http.put<ApiEnvelope<Portfolio>>(`/portfolio/holdings/${holdingId}`, input).then((r) => r.data),
  removeHolding: (holdingId: string) =>
    http.delete<ApiEnvelope<Portfolio>>(`/portfolio/holdings/${holdingId}`).then((r) => r.data),

  askChat: (input: ChatRequest) =>
    http.post<ChatResponse>("/chat", input).then((r) => r.data),
};

export type ApiClient = typeof api;

