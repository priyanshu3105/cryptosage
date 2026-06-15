import { useState, useMemo } from "react";
import type { PnlResult, DcaResult, RiskResult, TakeProfitLevel, TakeProfitResult } from "@/types";

export function usePnlCalculator() {
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [exitPrice, setExitPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [leverage, setLeverage] = useState<number>(1);
  const [fees, setFees] = useState<number>(0);

  const result = useMemo((): PnlResult | null => {
    if (!entryPrice || !exitPrice || !quantity) return null;
    const invested = entryPrice * quantity;
    const grossPnl = (exitPrice - entryPrice) * quantity * leverage;
    const netPnl = grossPnl - fees;
    const pnlPercent = invested > 0 ? (netPnl / invested) * 100 : 0;
    return { invested, grossPnl, netPnl, pnlPercent };
  }, [entryPrice, exitPrice, quantity, leverage, fees]);

  const reset = () => { setEntryPrice(0); setExitPrice(0); setQuantity(0); setLeverage(1); setFees(0); };

  return { entryPrice, setEntryPrice, exitPrice, setExitPrice, quantity, setQuantity, leverage, setLeverage, fees, setFees, result, reset };
}

export function useDcaCalculator() {
  const [initialInvestment, setInitialInvestment] = useState<number>(0);
  const [recurringAmount, setRecurringAmount] = useState<number>(0);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [duration, setDuration] = useState<number>(12);
  const [growthRate, setGrowthRate] = useState<number>(5);

  const result = useMemo((): DcaResult | null => {
    if (!recurringAmount || !duration) return null;
    const periods = frequency === "daily" ? duration * 30 : frequency === "weekly" ? duration * 4 : duration;
    const totalInvested = initialInvestment + recurringAmount * periods;
    const monthlyRate = growthRate / 100 / 12;
    let value = initialInvestment;
    for (let i = 0; i < periods; i++) {
      value = (value + recurringAmount) * (1 + monthlyRate / (frequency === "daily" ? 30 : frequency === "weekly" ? 4 : 1));
    }
    const estimatedHoldings = totalInvested > 0 ? value / (totalInvested / periods) : 0;
    return { totalInvested, estimatedHoldings, averageCost: totalInvested / Math.max(estimatedHoldings, 1), projectedValue: value };
  }, [initialInvestment, recurringAmount, frequency, duration, growthRate]);

  const reset = () => { setInitialInvestment(0); setRecurringAmount(0); setFrequency("monthly"); setDuration(12); setGrowthRate(5); };

  return { initialInvestment, setInitialInvestment, recurringAmount, setRecurringAmount, frequency, setFrequency, duration, setDuration, growthRate, setGrowthRate, result, reset };
}

export function useRiskCalculator() {
  const [accountSize, setAccountSize] = useState<number>(0);
  const [riskPercent, setRiskPercent] = useState<number>(2);
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [stopLoss, setStopLoss] = useState<number>(0);

  const result = useMemo((): RiskResult | null => {
    if (!accountSize || !riskPercent || !entryPrice || !stopLoss) return null;
    if (stopLoss >= entryPrice) return null;
    const riskAmount = accountSize * (riskPercent / 100);
    const priceDiff = entryPrice - stopLoss;
    const positionSize = riskAmount / priceDiff;
    const maxLoss = riskAmount;
    return { maxLoss, positionSize, riskAmount };
  }, [accountSize, riskPercent, entryPrice, stopLoss]);

  const reset = () => { setAccountSize(0); setRiskPercent(2); setEntryPrice(0); setStopLoss(0); };

  return { accountSize, setAccountSize, riskPercent, setRiskPercent, entryPrice, setEntryPrice, stopLoss, setStopLoss, result, reset };
}

export function useTakeProfitCalculator() {
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [levels, setLevels] = useState<TakeProfitLevel[]>([
    { price: 0, allocationPercent: 33 },
    { price: 0, allocationPercent: 33 },
    { price: 0, allocationPercent: 34 },
  ]);

  const updateLevel = (index: number, field: keyof TakeProfitLevel, value: number) => {
    setLevels((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const addLevel = () => setLevels((prev) => [...prev, { price: 0, allocationPercent: 0 }]);
  const removeLevel = (index: number) => setLevels((prev) => prev.filter((_, i) => i !== index));

  const result = useMemo((): TakeProfitResult | null => {
    if (!entryPrice || !quantity || levels.some((l) => !l.price)) return null;
    const totalAlloc = levels.reduce((s, l) => s + l.allocationPercent, 0);
    if (Math.abs(totalAlloc - 100) > 0.01) return null;

    const levelResults = levels.map((l) => {
      const qty = quantity * (l.allocationPercent / 100);
      const profit = (l.price - entryPrice) * qty;
      return { price: l.price, allocation: l.allocationPercent, profit };
    });

    const blendedExitPrice = levels.reduce((s, l) => s + l.price * (l.allocationPercent / 100), 0);
    const totalRealizedPnl = levelResults.reduce((s, l) => s + l.profit, 0);

    return { blendedExitPrice, levels: levelResults, totalRealizedPnl };
  }, [entryPrice, quantity, levels]);

  const reset = () => {
    setEntryPrice(0); setQuantity(0);
    setLevels([{ price: 0, allocationPercent: 33 }, { price: 0, allocationPercent: 33 }, { price: 0, allocationPercent: 34 }]);
  };

  return { entryPrice, setEntryPrice, quantity, setQuantity, levels, updateLevel, addLevel, removeLevel, result, reset };
}
