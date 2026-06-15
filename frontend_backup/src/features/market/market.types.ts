export type MarketCoin = {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h?: number;
};

export type MarketTopResponse = {
  coins: MarketCoin[];
  updatedAt: string;
};