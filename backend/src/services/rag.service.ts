type KnowledgeDoc = {
  id: string;
  title: string;
  type: "doc" | "api" | "glossary";
  url: string | null;
  content: string;
  keywords: string[];
};

const knowledgeBase: KnowledgeDoc[] = [
  {
    id: "market-basics",
    title: "Crypto Market Basics",
    type: "glossary",
    url: null,
    keywords: [
      "bitcoin",
      "ethereum",
      "crypto",
      "market cap",
      "market capitalization",
      "volume",
      "volatility",
      "wallet",
      "exchange",
      "tokenomics",
      "circulating supply",
      "gas fees",
      "candlestick",
      "support",
      "resistance",
    ],
    content:
      "Market basics include price, market capitalization, trading volume, volatility, wallets, and blockchain transaction costs.",
  },
  {
    id: "bitcoin-digital-gold",
    title: "Bitcoin as Digital Gold",
    type: "doc",
    url: null,
    keywords: [
      "bitcoin",
      "digital gold",
      "scarcity",
      "store of value",
      "halving",
      "fixed supply",
      "inflation hedge",
    ],
    content:
      "Bitcoin is often called digital gold because it has a capped supply, is designed to be scarce, and is often discussed as a store of value, although it remains much more volatile than gold.",
  },
  {
    id: "market-metrics",
    title: "Crypto Market Metrics",
    type: "glossary",
    url: null,
    keywords: [
      "market cap",
      "volume",
      "dominance",
      "fdv",
      "fully diluted valuation",
      "liquidity",
      "slippage",
      "price change",
      "market depth",
    ],
    content:
      "Common market metrics include market cap, trading volume, dominance, liquidity, slippage, and fully diluted valuation. These metrics help users interpret price action and market structure.",
  },
  {
    id: "defi-basics",
    title: "DeFi Concepts",
    type: "glossary",
    url: null,
    keywords: ["defi", "tvl", "apy", "apr", "staking", "liquidity", "amm"],
    content:
      "DeFi concepts include TVL, AMMs, liquidity pools, staking, lending, borrowing, collateral, and liquidation risk.",
  },
  {
    id: "staking-risk",
    title: "Staking Risk Overview",
    type: "doc",
    url: null,
    keywords: [
      "staking",
      "staking risk",
      "slashing",
      "lockup",
      "validator",
      "yield",
      "restaking",
    ],
    content:
      "Staking can expose users to lockup periods, validator performance issues, smart contract risk in liquid staking, and price volatility during the staking period.",
  },
  {
    id: "risk-awareness",
    title: "Risk Awareness Guide",
    type: "doc",
    url: null,
    keywords: [
      "risk",
      "exploit",
      "liquidation",
      "impermanent loss",
      "bridge",
      "audit",
      "phishing",
      "depeg",
      "counterparty risk",
      "rug pull",
      "volatility",
    ],
    content:
      "Crypto and DeFi risks include smart contract exploits, bridge risk, impermanent loss, liquidation, volatility, and custody mistakes.",
  },
  {
    id: "app-usage",
    title: "CryptoSage App Usage",
    type: "doc",
    url: null,
    keywords: ["portfolio", "dashboard", "chat mode", "market", "defi", "how to use"],
    content:
      "CryptoSage supports portfolio tracking, market exploration, DeFi protocol browsing, and chat modes for market or DeFi educational questions.",
  },
];

type RetrievalResult = {
  context: string;
  sources: Array<{ title: string; url: string | null; type: "doc" | "api" | "glossary" }>;
  confidence: number;
};

function normalize(query: string) {
  return query.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

export const ragService = {
  async retrieveContext(query: string): Promise<RetrievalResult> {
    const text = normalize(query);

    const scored = knowledgeBase
      .map((doc) => {
        const score = doc.keywords.filter((keyword) => text.includes(keyword)).length;
        return { doc, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (scored.length === 0) {
      return {
        context: "",
        sources: [],
        confidence: 0,
      };
    }

    const totalScore = scored.reduce((sum, entry) => sum + entry.score, 0);

    return {
      context: scored.map((entry) => `${entry.doc.title}: ${entry.doc.content}`).join("\n"),
      sources: scored.map((entry) => ({
        title: entry.doc.title,
        url: entry.doc.url,
        type: entry.doc.type,
      })),
      confidence: Math.min(1, totalScore / 6),
    };
  },
};
