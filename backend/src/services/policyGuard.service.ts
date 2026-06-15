import { ChatResponseSchema } from "../validators/chat.schema";

const bannedPatterns = [
  "buy this coin",
  "sell now",
  "guaranteed profit",
  "financial advice",
  "you should invest",
  "this will go up",
  "price prediction",
];

function containsBannedAdvice(answer: string) {
  const lower = answer.toLowerCase();
  return bannedPatterns.some((pattern) => lower.includes(pattern));
}

export const policyGuardService = {
  isSafeAnswer(answer: string) {
    return !containsBannedAdvice(answer);
  },

  sanitizeSuggestions(suggestedQuestions: string[] = []) {
    return suggestedQuestions
      .filter((question) => question && !containsBannedAdvice(question))
      .slice(0, 6);
  },

  validateResponseShape(response: unknown) {
    return ChatResponseSchema.safeParse(response);
  },
};
