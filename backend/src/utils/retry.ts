type RetryOptions = {
  retries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}) {
  const retries = options.retries ?? 2;
  const delayMs = options.delayMs ?? 300;
  const backoffMultiplier = options.backoffMultiplier ?? 2;

  let attempt = 0;
  let currentDelay = delayMs;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }

      await wait(currentDelay);
      currentDelay *= backoffMultiplier;
      attempt += 1;
    }
  }

  throw lastError;
}
