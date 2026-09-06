const MIN_DOMAIN_SIGNALS = 1;

const questionIntentSignals = [
  "what is",
  "what are",
  "what does",
  "what risks",
  "what should",
  "how does",
  "how do",
  "how should",
  "how can",
  "why is",
  "why are",
  "can you explain",
  "explain",
  "tell me about",
  "help me understand",
  "walk me through",
  "difference between",
  "compare",
  "besides",
  "should i check",
  "when is",
  "when are",
];

const educationalCueSignals = [
  "interpret",
  "difference",
  "compare",
  "meaning",
  "matters",
  "important",
  "watch for",
  "look for",
  "check",
  "risks",
  "risk",
];

const defiSignals = [
  "defi",
  "tvl",
  "total value locked",
  "apy",
  "apr",
  "amm",
  "dex",
  "liquidity",
  "liquidity pool",
  "impermanent loss",
  "yield",
  "yield farming",
  "farming",
  "vault",
  "staking",
  "restaking",
  "liquid staking",
  "lending",
  "borrowing",
  "collateral",
  "collateral ratio",
  "loan to value",
  "ltv",
  "liquidation",
  "health factor",
  "oracle",
  "price feed",
  "bridge",
  "cross chain",
  "cross-chain",
  "governance token",
  "dao",
  "protocol",
  "protocol revenue",
  "protocol treasury",
  "reward token",
  "synthetic asset",
  "flash loan",
  "yield aggregator",
  "money market",
  "perpetual dex",
  "stable swap",
  "stablecoin vault",
  "cdp",
  "collateralized debt position",
  "composability",
  "self custody",
  "self-custody",
  "wallet approval",
  "infinite approval",
  "mev",
  "sandwich attack",
  "smart contract",
  "smart contracts",
  "audit",
  "audits",
  "exploit",
  "bridge risk",
  "liquidation risk",
  "staking risk",
  "yield risk",
  "aave",
  "compound",
  "uniswap",
  "curve",
  "makerdao",
  "maker",
  "lido",
  "yearn",
  "balancer",
  "gmx",
  "sushiswap",
  "chainlink",
  "rocket pool",
  "frax",
  "pendle",
  "morpho",
  "convex",
  "dydx",
  "1inch",
  "cow protocol",
  "paraswap",
  "velodrome",
  "aerodrome",
];

const marketSignals = [
  "crypto",
  "cryptocurrency",
  "crypto market",
  "bitcoin",
  "btc",
  "ethereum",
  "eth",
  "altcoin",
  "stablecoin",
  "coin",
  "token",
  "market cap",
  "market capitalization",
  "fully diluted valuation",
  "fdv",
  "dominance",
  "volume",
  "trading volume",
  "circulating supply",
  "tokenomics",
  "volatility",
  "price",
  "price change",
  "price discovery",
  "market sentiment",
  "liquidity",
  "slippage",
  "candlestick",
  "chart",
  "support",
  "resistance",
  "order book",
  "market depth",
  "bull market",
  "bear market",
  "correction",
  "all time high",
  "all time low",
  "exchange",
  "wallet",
  "blockchain",
  "blockchain explorer",
  "gas fees",
  "halving",
  "proof of work",
  "proof of stake",
  "layer 1",
  "layer 2",
  "miners",
  "validators",
  "whale",
  "open interest",
  "funding rate",
  "spot trading",
  "futures trading",
  "leverage",
  "margin trading",
  "arbitrage",
  "trading pair",
  "rsi",
  "macd",
  "moving average",
  "fear and greed",
  "whitepaper",
  "token unlock",
  "token burn",
  "meme coin",
  "blue chip",
  "fork",
  "hard fork",
  "soft fork",
  // Common assets people ask about by name
  "solana",
  "sol",
  "cardano",
  "ada",
  "ripple",
  "xrp",
  "dogecoin",
  "doge",
  "polkadot",
  "dot",
  "avalanche",
  "avax",
  "polygon",
  "matic",
  "chainlink",
  "link",
  "litecoin",
  "ltc",
  "bitcoin cash",
  "bch",
  "tron",
  "trx",
  "cosmos",
  "atom",
  "monero",
  "xmr",
  "zcash",
  "zec",
  "dash",
  "stellar",
  "xlm",
  "toncoin",
  "sui",
  "aptos",
  "arbitrum",
  "optimism",
  "shiba",
  "shib",
  "pepe",
  "usdt",
  "tether",
  "usdc",
  "dai",
  "bnb",
  "binance",
];

const riskSignals = [
  "risk",
  "risks",
  "volatile",
  "volatility",
  "liquidation",
  "impermanent loss",
  "exploit",
  "audit",
  "audits",
  "rug pull",
  "phishing",
  "seed phrase",
  "bridge hack",
  "depeg",
  "counterparty risk",
  "oracle failure",
  "overexposure",
  "concentration risk",
  "low liquidity",
  "high apy",
  "high apr",
  "leverage",
  "smart contract bug",
  "admin key",
  "wallet approval",
  "contract risk",
  "security",
  "safe",
  "unsafe",
];

const appHelpSignals = [
  "portfolio",
  "holding",
  "holdings",
  "dashboard",
  "watchlist",
  "journal",
  "chat feature",
  "chat mode",
  "market mode",
  "defi mode",
  "auto mode",
  "cryptosage",
  "app",
  "endpoint",
  "api",
  "postman",
  "requestid",
  "request id",
  "cachehit",
  "telemetry",
  "health check",
  "health endpoint",
  "top crypto coins",
  "protocol tvl",
  "price history",
  "auth token",
  "bearer token",
  "log in",
  "login",
  "register",
  "change password",
  "delete my account",
  "delete account",
  "guest",
  "sign up",
  "signup",
];

const blockedIntentSignals = [
  "resume",
  "cv",
  "cover letter",
  "girlfriend",
  "boyfriend",
  "medical",
  "diagnosis",
  "politics",
  "election",
  "essay",
  "homework",
  "coding interview",
  "visa",
  "job application",
  "relationship advice",
  "therapy",
  "recipe",
  "weather",
  "movie recommendation",
];

export type LayerADecision = {
  allowed: boolean;
  modeUsed: "market" | "defi";
  reason: string;
  confidence: number;
  matchedSignals: string[];
};

function normalize(message: string) {
  return message.toLowerCase().replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function matchSignals(text: string, signals: string[]) {
  return signals.filter((signal) => {
    // Prefer word-boundary-ish matching for short tickers (btc, eth, sol)
    if (signal.length <= 3) {
      return new RegExp(`(?:^|\\s)${signal}(?:$|\\s)`).test(text);
    }
    return text.includes(signal);
  });
}

function unique(items: string[]) {
  return [...new Set(items)];
}

function pickMode(
  requestedMode: "market" | "defi" | "auto",
  matchedDefi: string[],
  matchedMarket: string[]
): "market" | "defi" {
  if (requestedMode === "defi" || requestedMode === "market") return requestedMode;
  return matchedDefi.length > matchedMarket.length ? "defi" : "market";
}

export const topicGateService = {
  classify(message: string, requestedMode: "market" | "defi" | "auto" = "auto"): LayerADecision {
    const text = normalize(message);

    const matchedDefi = matchSignals(text, defiSignals);
    const matchedMarket = matchSignals(text, marketSignals);
    const matchedRisk = matchSignals(text, riskSignals);
    const matchedAppHelp = matchSignals(text, appHelpSignals);
    const matchedBlocked = matchSignals(text, blockedIntentSignals);
    const matchedQuestionIntent = matchSignals(text, questionIntentSignals);
    const matchedEducationalCue = matchSignals(text, educationalCueSignals);

    const domainSignalCount =
      matchedDefi.length + matchedMarket.length + matchedRisk.length + matchedAppHelp.length;
    const modeUsed = pickMode(requestedMode, matchedDefi, matchedMarket);
    const allMatched = unique([
      ...matchedMarket,
      ...matchedDefi,
      ...matchedRisk,
      ...matchedAppHelp,
      ...matchedEducationalCue,
      ...matchedQuestionIntent,
    ]);

    // Hard block only when there is no crypto/DeFi signal at all.
    if (matchedBlocked.length > 0 && domainSignalCount === 0) {
      return {
        allowed: false,
        modeUsed,
        reason: "Blocked intent detected",
        confidence: 0,
        matchedSignals: unique(matchedBlocked),
      };
    }

    if (matchedAppHelp.length > 0) {
      return {
        allowed: true,
        modeUsed,
        reason: "App usage question allowed",
        confidence: Math.min(1, matchedAppHelp.length / 4),
        matchedSignals: unique(matchedAppHelp),
      };
    }

    // Any clear crypto / DeFi / risk signal is enough.
    if (domainSignalCount >= MIN_DOMAIN_SIGNALS) {
      return {
        allowed: true,
        modeUsed,
        reason: `${modeUsed === "defi" ? "DeFi" : "Market"} educational query allowed`,
        confidence: Math.min(1, domainSignalCount / 6),
        matchedSignals: allMatched,
      };
    }

    // "What is <asset>?" style questions with a short unknown name still go to the model.
    // The LLM can answer or say it is unsure; the gate should not hard-refuse.
    const whatIsMatch = text.match(/^(?:what is|whats|what's|tell me about|explain)\s+([a-z0-9-]{2,40})\b/);
    if (whatIsMatch && matchedBlocked.length === 0) {
      return {
        allowed: true,
        modeUsed: "market",
        reason: "Short educational crypto-style query allowed",
        confidence: 0.35,
        matchedSignals: unique([...matchedQuestionIntent, whatIsMatch[1]]),
      };
    }

    if (matchedQuestionIntent.length > 0 && matchedEducationalCue.length > 0) {
      return {
        allowed: true,
        modeUsed,
        reason: "Educational crypto-adjacent query allowed",
        confidence: 0.4,
        matchedSignals: allMatched,
      };
    }

    return {
      allowed: false,
      modeUsed,
      reason: "Query outside supported crypto and DeFi domain",
      confidence: 0,
      matchedSignals: allMatched,
    };
  },
};
