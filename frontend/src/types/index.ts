// Session
export interface User {
  id: string;
  email: string;
  name: string;
  isGuest?: boolean;
  avatar?: string;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface UpgradeGuestRequest {
  name: string;
  email: string;
  password: string;
}

// Portfolio
export interface Holding {
  id?: string;
  _id?: string;
  coinId: string;
  symbol: string | null;
  name: string | null;
  amount: number;
  avgBuyPrice: number;
  currentPrice: number;
  /** quantity × live price */
  value: number;
  /** remaining cost basis: quantity × average buy price (fees included on buys) */
  invested: number;
  pnl: number;
  pnlPercent: number;
  allocation: number;
  icon?: string;
  /** How the displayed price was resolved. Never treat a failed feed as $0. */
  priceSource: "live" | "market" | "journal" | "unavailable";
}

export interface PortfolioSummary {
  id?: string;
  name?: string;
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  change24h: number;
  change24hPercent: number;
  holdings: Holding[];
}

export interface Transaction {
  id: string;
  coinId: string;
  symbol: string;
  type: "buy" | "sell" | "transfer";
  amount: number;
  price: number;
  total: number;
  fees: number;
  date: string;
  note?: string;
}

export interface AddHoldingRequest {
  coinId: string;
  symbol?: string;
  name?: string;
  amount: number;
  avgBuyPrice: number;
}

// Market
export interface Coin {
  id: string;
  symbol: string;
  name: string;
  icon?: string;
  price: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
  change7d: number;
  sparkline?: number[];
  rank: number;
}

export interface CoinDetail extends Coin {
  description?: string;
  ath: number;
  athDate: string;
  atl: number;
  atlDate: string;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply?: number;
  priceHistory: PricePoint[];
}

export interface PricePoint {
  timestamp: number;
  price: number;
}

export type TimeRange = "1d" | "7d" | "30d" | "90d" | "1y" | "all";

// DeFi
export interface Protocol {
  id?: string;
  slug: string;
  name: string;
  icon?: string;
  tvl: number;
  tvlChange24h: number;
  chain: string;
  category: string;
  url?: string;
}

export interface ProtocolDetail extends Protocol {
  description?: string;
  tvlHistory: { timestamp: number; tvl: number }[];
  chains: string[];
  audits?: string[];
}

// Chat
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
  messageCount: number;
}

export interface SendMessageRequest {
  sessionId?: string;
  message: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
  sessionId: string;
}

// Portfolio Journal
export type JournalActionType = "buy" | "sell" | "note" | "analysis" | "risk";
export type Sentiment = "bullish" | "bearish" | "neutral";

export interface PortfolioLog {
  id: string;
  createdAt: string;
  coinId?: string;
  symbol?: string;
  name?: string;
  actionType: JournalActionType;
  quantity?: number;
  price?: number;
  fees?: number;
  tags?: string[];
  sentiment?: Sentiment;
  note: string;
}

export interface CreateLogRequest {
  coinId?: string;
  symbol?: string;
  name?: string;
  actionType: JournalActionType;
  quantity?: number;
  price?: number;
  fees?: number;
  tags?: string[];
  sentiment?: Sentiment;
  note: string;
}

export interface JournalFilters {
  dateFrom?: string;
  dateTo?: string;
  coinId?: string;
  actionType?: JournalActionType;
  sentiment?: Sentiment;
  search?: string;
}

// AI Ask
export interface AskAIRequest {
  question: string;
  logs: PortfolioLog[];
  holdings: Holding[];
  filters: JournalFilters;
  includeMarketContext: boolean;
}

export interface AskAIResponse {
  answer: string;
  confidence?: "high" | "medium" | "low";
  insights?: string[];
  caveats?: string[];
  contextUsed: {
    logsCount: number;
    holdingsIncluded?: boolean;
    marketSnapshot?: boolean;
    usedHoldings?: boolean;
    usedMarketContext?: boolean;
  };
}

// Calculator
export interface PnlResult {
  invested: number;
  grossPnl: number;
  netPnl: number;
  pnlPercent: number;
}

export interface DcaResult {
  totalInvested: number;
  estimatedHoldings: number;
  averageCost: number;
  projectedValue: number;
}

export interface RiskResult {
  maxLoss: number;
  positionSize: number;
  riskAmount: number;
}

export interface TakeProfitLevel {
  price: number;
  allocationPercent: number;
}

export interface TakeProfitResult {
  blendedExitPrice: number;
  levels: { price: number; allocation: number; profit: number }[];
  totalRealizedPnl: number;
}

// Shared
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
