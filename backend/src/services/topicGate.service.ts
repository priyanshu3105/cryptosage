const MIN_SCORE = 3;

const questionIntentSignals = [
  "what is",
  "what does",
  "how does",
  "how do",
  "how should i interpret",
  "why is",
  "why are",
  "what are",
  "how can",
  "can you explain",
  "explain",
  "tell me about",
  "help me understand",
  "walk me through",
  "difference between",
  "compare",
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
];

const defiSignals = [
  "defi",
  "tvl",
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
  "ethereum",
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
];

const appHelpSignals = [
  "portfolio",
  "holding",
  "holdings",
  "dashboard",
  "watchlist",
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
  return signals.filter((signal) => text.includes(signal));
}

function unique(items: string[]) {
  return [...new Set(items)];
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

    const defiScore = matchedDefi.length + matchedRisk.filter((signal) => matchedDefi.includes(signal)).length;
    const marketScore =
      matchedMarket.length + matchedRisk.filter((signal) => matchedMarket.includes(signal)).length;
    const appHelpScore = matchedAppHelp.length;
    const maxScore = Math.max(defiScore, marketScore);
    const explicitModeSupport =
      (requestedMode === "defi" && matchedDefi.length >= 1) ||
      (requestedMode === "market" && matchedMarket.length >= 1);
    const autoModeStrongMatch =
      requestedMode === "auto" &&
      ((matchedDefi.length >= 2 && matchedMarket.length === 0) ||
        (matchedMarket.length >= 2 && matchedDefi.length === 0));
    const shortEducationalQuery =
      (matchedQuestionIntent.length >= 1 || matchedEducationalCue.length >= 1) &&
      ((matchedDefi.length >= 1 && matchedMarket.length === 0) ||
        (matchedMarket.length >= 1 && matchedDefi.length === 0));

    if (matchedBlocked.length > 0 && maxScore < MIN_SCORE + 2 && appHelpScore === 0) {
      return {
        allowed: false,
        modeUsed: requestedMode === "defi" ? "defi" : "market",
        reason: "Blocked intent detected",
        confidence: 0,
        matchedSignals: unique(matchedBlocked),
      };
    }

    if (appHelpScore > 0 && maxScore < MIN_SCORE) {
      return {
        allowed: true,
        modeUsed: requestedMode === "defi" ? "defi" : "market",
        reason: "App usage question allowed",
        confidence: Math.min(1, appHelpScore / 8),
        matchedSignals: unique(matchedAppHelp),
      };
    }

    if (explicitModeSupport || autoModeStrongMatch || shortEducationalQuery) {
      const modeUsed: "market" | "defi" =
        requestedMode === "auto" ? (matchedDefi.length > matchedMarket.length ? "defi" : "market") : requestedMode;

      return {
        allowed: true,
        modeUsed,
        reason: `${modeUsed === "defi" ? "DeFi" : "Market"} educational query allowed`,
        confidence: Math.min(1, Math.max(maxScore, 2) / 8),
        matchedSignals: unique([...matchedMarket, ...matchedDefi, ...matchedRisk, ...matchedAppHelp]),
      };
    }

    if (maxScore < MIN_SCORE) {
      return {
        allowed: false,
        modeUsed: requestedMode === "defi" ? "defi" : "market",
        reason: "Query outside supported crypto and DeFi domain",
        confidence: Math.min(1, maxScore / 8),
        matchedSignals: unique([
          ...matchedMarket,
          ...matchedDefi,
          ...matchedRisk,
          ...matchedEducationalCue,
        ]),
      };
    }

    const modeUsed: "market" | "defi" = matchedDefi.length > matchedMarket.length ? "defi" : "market";

    return {
      allowed: true,
      modeUsed,
      reason: `${modeUsed === "defi" ? "DeFi" : "Market"} educational query allowed`,
      confidence: Math.min(1, maxScore / 8),
      matchedSignals: unique([
        ...matchedMarket,
        ...matchedDefi,
        ...matchedRisk,
        ...matchedAppHelp,
        ...matchedEducationalCue,
      ]),
    };
  },
};
