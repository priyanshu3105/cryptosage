import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator as CalcIcon, RotateCcw, Copy, Plus, Trash2 } from "lucide-react";
import { usePnlCalculator, useDcaCalculator, useRiskCalculator, useTakeProfitCalculator } from "@/hooks/useCalculatorState";
import { PageTransition, FadeIn } from "@/components/shared/Animations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatPercent } from "@/lib/format";
import { toast } from "sonner";

type Tab = "pnl" | "dca" | "risk" | "takeprofit";

function CalcInput({ label, value, onChange, placeholder = "0", type = "number", suffix }: { label: string; value: number | string; onChange: (v: number) => void; placeholder?: string; type?: string; suffix?: string }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input type={type} placeholder={placeholder} value={value || ""} onChange={(e) => onChange(Number(e.target.value))} className="font-mono" />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-mono text-sm font-medium ${highlight ? "text-primary" : "text-card-foreground"}`}>{value}</span>
    </div>
  );
}

function PnlTab() {
  const calc = usePnlCalculator();
  const copyResult = () => { if (calc.result) { navigator.clipboard.writeText(`PnL: ${formatCurrency(calc.result.netPnl)} (${formatPercent(calc.result.pnlPercent)})`); toast.success("Copied!"); }};

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-3">
        <CalcInput label="Entry Price" value={calc.entryPrice} onChange={calc.setEntryPrice} suffix="$" />
        <CalcInput label="Exit Price" value={calc.exitPrice} onChange={calc.setExitPrice} suffix="$" />
        <CalcInput label="Quantity" value={calc.quantity} onChange={calc.setQuantity} />
        <CalcInput label="Leverage" value={calc.leverage} onChange={calc.setLeverage} suffix="x" />
        <CalcInput label="Fees" value={calc.fees} onChange={calc.setFees} suffix="$" />
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={calc.reset}><RotateCcw className="mr-1.5 h-3 w-3" />Reset</Button></div>
      </div>
      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <h3 className="mb-4 text-sm font-medium text-card-foreground">Results</h3>
        {calc.result ? (
          <>
            <div className="divide-y divide-border">
              <ResultRow label="Invested" value={formatCurrency(calc.result.invested)} />
              <ResultRow label="Gross P&L" value={formatCurrency(calc.result.grossPnl)} />
              <ResultRow label="Net P&L" value={formatCurrency(calc.result.netPnl)} highlight />
              <ResultRow label="Return" value={formatPercent(calc.result.pnlPercent)} highlight />
            </div>
            <Button variant="outline" size="sm" className="mt-4" onClick={copyResult}><Copy className="mr-1.5 h-3 w-3" />Copy</Button>
          </>
        ) : <p className="text-sm text-muted-foreground">Enter values to see results</p>}
      </div>
    </div>
  );
}

function DcaTab() {
  const calc = useDcaCalculator();
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-3">
        <CalcInput label="Initial Investment" value={calc.initialInvestment} onChange={calc.setInitialInvestment} suffix="$" />
        <CalcInput label="Recurring Amount" value={calc.recurringAmount} onChange={calc.setRecurringAmount} suffix="$" />
        <div>
          <Label className="text-xs text-muted-foreground">Frequency</Label>
          <div className="flex gap-1 mt-1">
            {(["daily", "weekly", "monthly"] as const).map((f) => (
              <button key={f} onClick={() => calc.setFrequency(f)} className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${calc.frequency === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{f}</button>
            ))}
          </div>
        </div>
        <CalcInput label="Duration (months)" value={calc.duration} onChange={calc.setDuration} />
        <CalcInput label="Expected Growth Rate" value={calc.growthRate} onChange={calc.setGrowthRate} suffix="%" />
        <Button variant="outline" size="sm" onClick={calc.reset}><RotateCcw className="mr-1.5 h-3 w-3" />Reset</Button>
      </div>
      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <h3 className="mb-4 text-sm font-medium text-card-foreground">Results</h3>
        {calc.result ? (
          <div className="divide-y divide-border">
            <ResultRow label="Total Invested" value={formatCurrency(calc.result.totalInvested)} />
            <ResultRow label="Average Cost" value={formatCurrency(calc.result.averageCost)} />
            <ResultRow label="Projected Value" value={formatCurrency(calc.result.projectedValue)} highlight />
          </div>
        ) : <p className="text-sm text-muted-foreground">Enter values to see results</p>}
      </div>
    </div>
  );
}

function RiskTab() {
  const calc = useRiskCalculator();
  const isInvalid = calc.stopLoss > 0 && calc.entryPrice > 0 && calc.stopLoss >= calc.entryPrice;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-3">
        <CalcInput label="Account Size" value={calc.accountSize} onChange={calc.setAccountSize} suffix="$" />
        <CalcInput label="Risk Per Trade" value={calc.riskPercent} onChange={calc.setRiskPercent} suffix="%" />
        <CalcInput label="Entry Price" value={calc.entryPrice} onChange={calc.setEntryPrice} suffix="$" />
        <CalcInput label="Stop Loss" value={calc.stopLoss} onChange={calc.setStopLoss} suffix="$" />
        {isInvalid && <p className="text-xs text-destructive">Stop loss must be below entry price</p>}
        <Button variant="outline" size="sm" onClick={calc.reset}><RotateCcw className="mr-1.5 h-3 w-3" />Reset</Button>
      </div>
      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <h3 className="mb-4 text-sm font-medium text-card-foreground">Results</h3>
        {calc.result ? (
          <div className="divide-y divide-border">
            <ResultRow label="Risk Amount" value={formatCurrency(calc.result.riskAmount)} />
            <ResultRow label="Max Loss" value={formatCurrency(calc.result.maxLoss)} />
            <ResultRow label="Position Size" value={`${calc.result.positionSize.toFixed(4)} units`} highlight />
          </div>
        ) : <p className="text-sm text-muted-foreground">{isInvalid ? "Fix inputs above" : "Enter values to see results"}</p>}
      </div>
    </div>
  );
}

function TakeProfitTab() {
  const calc = useTakeProfitCalculator();
  const totalAlloc = calc.levels.reduce((s, l) => s + l.allocationPercent, 0);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-3">
        <CalcInput label="Entry Price" value={calc.entryPrice} onChange={calc.setEntryPrice} suffix="$" />
        <CalcInput label="Quantity" value={calc.quantity} onChange={calc.setQuantity} />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">TP Levels</Label>
            <Button variant="ghost" size="sm" onClick={calc.addLevel} className="h-7"><Plus className="h-3 w-3" /></Button>
          </div>
          {calc.levels.map((level, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1"><Input type="number" placeholder="Price" value={level.price || ""} onChange={(e) => calc.updateLevel(i, "price", Number(e.target.value))} className="font-mono text-xs" /></div>
              <div className="w-20"><Input type="number" placeholder="%" value={level.allocationPercent || ""} onChange={(e) => calc.updateLevel(i, "allocationPercent", Number(e.target.value))} className="font-mono text-xs" /></div>
              {calc.levels.length > 1 && <button onClick={() => calc.removeLevel(i)} className="mb-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>}
            </div>
          ))}
          {Math.abs(totalAlloc - 100) > 0.01 && <p className="text-xs text-destructive">Allocations must sum to 100% (currently {totalAlloc}%)</p>}
        </div>
        <Button variant="outline" size="sm" onClick={calc.reset}><RotateCcw className="mr-1.5 h-3 w-3" />Reset</Button>
      </div>
      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <h3 className="mb-4 text-sm font-medium text-card-foreground">Results</h3>
        {calc.result ? (
          <>
            <div className="divide-y divide-border">
              <ResultRow label="Blended Exit" value={formatCurrency(calc.result.blendedExitPrice)} />
              <ResultRow label="Total Realized P&L" value={formatCurrency(calc.result.totalRealizedPnl)} highlight />
            </div>
            <div className="mt-4 space-y-2">
              {calc.result.levels.map((l, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">TP {i + 1} @ {formatCurrency(l.price)} ({l.allocation}%)</span>
                  <span className={`font-mono ${l.profit >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(l.profit)}</span>
                </div>
              ))}
            </div>
          </>
        ) : <p className="text-sm text-muted-foreground">Enter values to see results</p>}
      </div>
    </div>
  );
}

const tabs: { id: Tab; label: string }[] = [
  { id: "pnl", label: "Position P&L" },
  { id: "dca", label: "DCA" },
  { id: "risk", label: "Risk/Position Size" },
  { id: "takeprofit", label: "Take Profit" },
];

export default function CalculatorPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pnl");

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Crypto Calculator</h1>
        <p className="text-sm text-muted-foreground">Practical tools for position sizing, DCA, and risk management</p>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`relative rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? "text-card-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {activeTab === tab.id && <motion.div layoutId="calc-tab" className="absolute inset-0 rounded-md bg-card shadow-sm" />}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <FadeIn key={activeTab}>
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          {activeTab === "pnl" && <PnlTab />}
          {activeTab === "dca" && <DcaTab />}
          {activeTab === "risk" && <RiskTab />}
          {activeTab === "takeprofit" && <TakeProfitTab />}
        </div>
      </FadeIn>
    </PageTransition>
  );
}
