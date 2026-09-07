import type {
  Holding, PortfolioSummary, Coin, Protocol, Transaction,
  ChatSession, ChatMessage, PortfolioLog, CoinDetail, ProtocolDetail,
} from "@/types";

export const MOCK_ENABLED = true;

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

export const mockHoldings: Holding[] = [
  { id: "1", coinId: "bitcoin", symbol: "BTC", name: "Bitcoin", amount: 1.5, avgBuyPrice: 42000, currentPrice: 67500, value: 101250, invested: 63000, pnl: 38250, pnlPercent: 60.71, allocation: 55, priceSource: "market" },
  { id: "2", coinId: "ethereum", symbol: "ETH", name: "Ethereum", amount: 12, avgBuyPrice: 2800, currentPrice: 3450, value: 41400, invested: 33600, pnl: 7800, pnlPercent: 23.21, allocation: 22.5, priceSource: "market" },
  { id: "3", coinId: "solana", symbol: "SOL", name: "Solana", amount: 100, avgBuyPrice: 95, currentPrice: 178, value: 17800, invested: 9500, pnl: 8300, pnlPercent: 87.37, allocation: 9.7, priceSource: "market" },
  { id: "4", coinId: "chainlink", symbol: "LINK", name: "Chainlink", amount: 500, avgBuyPrice: 14, currentPrice: 18.5, value: 9250, invested: 7000, pnl: 2250, pnlPercent: 32.14, allocation: 5, priceSource: "market" },
  { id: "5", coinId: "aave", symbol: "AAVE", name: "Aave", amount: 50, avgBuyPrice: 85, currentPrice: 142, value: 7100, invested: 4250, pnl: 2850, pnlPercent: 67.06, allocation: 3.9, priceSource: "market" },
];

export const mockPortfolioSummary: PortfolioSummary = {
  totalValue: 183800,
  totalPnl: 59450,
  totalPnlPercent: 47.82,
  change24h: 3240,
  change24hPercent: 1.79,
  holdings: mockHoldings,
};

export const mockCoins: Coin[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", price: 67500, marketCap: 1320000000000, volume24h: 28000000000, change24h: 2.4, change7d: 5.1, rank: 1, sparkline: [64000, 65200, 64800, 66000, 67100, 67500] },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", price: 3450, marketCap: 415000000000, volume24h: 15000000000, change24h: 1.8, change7d: 3.2, rank: 2, sparkline: [3300, 3350, 3380, 3400, 3430, 3450] },
  { id: "solana", symbol: "SOL", name: "Solana", price: 178, marketCap: 78000000000, volume24h: 3200000000, change24h: 4.2, change7d: 8.7, rank: 5, sparkline: [160, 165, 170, 172, 175, 178] },
  { id: "cardano", symbol: "ADA", name: "Cardano", price: 0.62, marketCap: 22000000000, volume24h: 800000000, change24h: -1.2, change7d: -0.5, rank: 8, sparkline: [0.64, 0.63, 0.625, 0.63, 0.62, 0.62] },
  { id: "chainlink", symbol: "LINK", name: "Chainlink", price: 18.5, marketCap: 10800000000, volume24h: 600000000, change24h: 3.1, change7d: 7.2, rank: 12, sparkline: [16.5, 17, 17.5, 18, 18.2, 18.5] },
  { id: "aave", symbol: "AAVE", name: "Aave", price: 142, marketCap: 2100000000, volume24h: 180000000, change24h: 5.4, change7d: 12.1, rank: 35, sparkline: [125, 130, 135, 138, 140, 142] },
  { id: "uniswap", symbol: "UNI", name: "Uniswap", price: 12.8, marketCap: 7700000000, volume24h: 320000000, change24h: -0.8, change7d: 2.1, rank: 18, sparkline: [12.5, 12.6, 12.9, 12.7, 12.8, 12.8] },
  { id: "polygon", symbol: "MATIC", name: "Polygon", price: 0.89, marketCap: 8200000000, volume24h: 450000000, change24h: 1.5, change7d: -1.3, rank: 15, sparkline: [0.88, 0.87, 0.89, 0.88, 0.9, 0.89] },
];

export const mockProtocols: Protocol[] = [
  { id: "aave-v3", slug: "aave-v3", name: "Aave V3", tvl: 12500000000, tvlChange24h: 1.2, chain: "Multi-chain", category: "Lending" },
  { id: "lido", slug: "lido", name: "Lido", tvl: 18200000000, tvlChange24h: 0.8, chain: "Ethereum", category: "Liquid Staking" },
  { id: "uniswap-v3", slug: "uniswap-v3", name: "Uniswap V3", tvl: 5800000000, tvlChange24h: -0.3, chain: "Multi-chain", category: "DEX" },
  { id: "makerdao", slug: "makerdao", name: "MakerDAO", tvl: 8400000000, tvlChange24h: 0.5, chain: "Ethereum", category: "CDP" },
  { id: "curve", slug: "curve", name: "Curve Finance", tvl: 4200000000, tvlChange24h: -1.1, chain: "Multi-chain", category: "DEX" },
  { id: "eigenlayer", slug: "eigenlayer", name: "EigenLayer", tvl: 9800000000, tvlChange24h: 2.4, chain: "Ethereum", category: "Restaking" },
];

export const mockTransactions: Transaction[] = [
  { id: "t1", coinId: "bitcoin", symbol: "BTC", type: "buy", amount: 0.5, price: 43000, total: 21500, fees: 10, date: "2024-01-15T10:30:00Z" },
  { id: "t2", coinId: "ethereum", symbol: "ETH", type: "buy", amount: 5, price: 2600, total: 13000, fees: 8, date: "2024-02-01T14:00:00Z" },
  { id: "t3", coinId: "solana", symbol: "SOL", type: "buy", amount: 50, price: 95, total: 4750, fees: 5, date: "2024-02-20T09:15:00Z" },
  { id: "t4", coinId: "bitcoin", symbol: "BTC", type: "buy", amount: 1.0, price: 41500, total: 41500, fees: 15, date: "2024-03-05T16:45:00Z" },
  { id: "t5", coinId: "ethereum", symbol: "ETH", type: "sell", amount: 2, price: 3200, total: 6400, fees: 6, date: "2024-03-20T11:00:00Z" },
];

export const mockLogs: PortfolioLog[] = [
  { id: "l1", createdAt: "2024-03-20T11:00:00Z", coinId: "bitcoin", symbol: "BTC", name: "Bitcoin", actionType: "buy", quantity: 0.5, price: 67000, fees: 10, tags: ["DCA"], sentiment: "bullish", note: "Regular DCA buy. Market looks strong after ETF approval momentum." },
  { id: "l2", createdAt: "2024-03-18T09:00:00Z", coinId: "ethereum", symbol: "ETH", name: "Ethereum", actionType: "analysis", tags: ["ETH", "upgrade"], sentiment: "bullish", note: "Dencun upgrade successful. L2 fees dropping significantly. Bullish for ecosystem growth." },
  { id: "l3", createdAt: "2024-03-15T14:30:00Z", actionType: "risk", tags: ["macro"], sentiment: "neutral", note: "Fed meeting next week. Could create volatility. Consider reducing leverage." },
  { id: "l4", createdAt: "2024-03-12T10:00:00Z", coinId: "solana", symbol: "SOL", name: "Solana", actionType: "sell", quantity: 20, price: 175, fees: 3, tags: ["profit-taking"], sentiment: "neutral", note: "Taking partial profits on SOL position. Up 80% from entry." },
];

export const mockChatSessions: ChatSession[] = [
  { id: "cs1", title: "BTC Price Analysis", lastMessage: "Based on current trends...", updatedAt: "2024-03-20T11:00:00Z", messageCount: 8 },
  { id: "cs2", title: "DeFi Yield Strategy", lastMessage: "You could consider...", updatedAt: "2024-03-19T15:30:00Z", messageCount: 12 },
];

export const mockChatMessages: ChatMessage[] = [
  { id: "m1", role: "user", content: "What's your analysis on BTC price action?", timestamp: "2024-03-20T10:55:00Z" },
  { id: "m2", role: "assistant", content: "Based on current market data, Bitcoin is showing strong momentum above the $65,000 support level. Key observations:\n\n1. **Volume**: Trading volume has increased 15% over the past week\n2. **RSI**: Currently at 62, indicating room for upside before overbought\n3. **Moving Averages**: Price is above both 50-day and 200-day MA\n\nThe next key resistance level is around $69,000. A break above this could target the previous ATH.", timestamp: "2024-03-20T10:56:00Z" },
];

export async function getMockData<T>(data: T): Promise<T> {
  await delay();
  return structuredClone(data);
}
