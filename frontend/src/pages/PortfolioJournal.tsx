import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Plus, Search, Trash2, Edit2, TrendingUp, TrendingDown, Minus,
  Brain, X, BookOpen, ChevronsUpDown, Check,
} from "lucide-react";
import { usePortfolioLogs } from "@/hooks/usePortfolioLogs";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useMarket } from "@/hooks/useMarket";
import { PageTransition, FadeIn } from "@/components/shared/Animations";
import { TableSkeleton, CardSkeleton } from "@/components/shared/Skeletons";
import { ErrorCard } from "@/components/shared/ErrorCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { formatDateTime, formatCurrency } from "@/lib/format";
import type { JournalActionType, Sentiment, CreateLogRequest, ApiError } from "@/types";
import type { ReplayWarning } from "@/services/api";

const actionTypeConfig: Record<JournalActionType, { icon: React.ElementType; color: string }> = {
  buy: { icon: TrendingUp, color: "text-success bg-success/10" },
  sell: { icon: TrendingDown, color: "text-destructive bg-destructive/10" },
  note: { icon: Edit2, color: "text-primary bg-primary/10" },
  analysis: { icon: Brain, color: "text-warning bg-warning/10" },
  risk: { icon: Minus, color: "text-muted-foreground bg-muted" },
};

const sentimentConfig: Record<Sentiment, { label: string; color: string }> = {
  bullish: { label: "Bullish", color: "bg-success/10 text-success border-success/20" },
  bearish: { label: "Bearish", color: "bg-destructive/10 text-destructive border-destructive/20" },
  neutral: { label: "Neutral", color: "bg-muted text-muted-foreground border-border" },
};

function CreateLogModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: CreateLogRequest) => void | Promise<void>;
}) {
  const { allCoins, isLoading: coinsLoading } = useMarket();
  const [coinOpen, setCoinOpen] = useState(false);
  const [form, setForm] = useState<CreateLogRequest>({
    actionType: "note",
    note: "",
  });

  const setActionType = (type: JournalActionType) => {
    setForm((prev) => ({
      ...prev,
      actionType: type,
      ...(type !== "buy" && type !== "sell"
        ? {
            coinId: undefined,
            symbol: undefined,
            name: undefined,
            quantity: undefined,
            price: undefined,
            fees: undefined,
          }
        : {}),
    }));
  };

  const selectedCoin = allCoins.find((c) => c.id === form.coinId);

  const tradeFieldsValid =
    form.actionType !== "buy" && form.actionType !== "sell"
      ? true
      : Boolean(
          form.coinId?.trim() &&
            (form.quantity ?? 0) > 0 &&
            (form.price ?? 0) >= 0 &&
            Number.isFinite(form.quantity) &&
            Number.isFinite(form.price)
        );

  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.note.trim() || !tradeFieldsValid || submitting) return;
    setSubmitting(true);
    try {
      await onSave(form);
      onClose();
    } catch {
      // Errors are toasted by the caller; keep the modal open with the user's input intact.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-card-foreground">New Log Entry</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(actionTypeConfig) as JournalActionType[]).map((type) => (
              <button key={type} type="button" onClick={() => setActionType(type)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${form.actionType === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{type}</button>
            ))}
          </div>

          {(form.actionType === "buy" || form.actionType === "sell") && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Coin</Label>
                <Popover open={coinOpen} onOpenChange={setCoinOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={coinOpen}
                      disabled={coinsLoading}
                      className="h-9 w-full justify-between font-normal"
                    >
                      {selectedCoin ? `${selectedCoin.name} (${selectedCoin.symbol})` : coinsLoading ? "Loading coins…" : "Search coins…"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="z-[60] w-[--radix-popover-trigger-width] min-w-[280px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search by name or symbol…" />
                      <CommandList>
                        <CommandEmpty>{coinsLoading ? "Loading…" : "No coin found."}</CommandEmpty>
                        <CommandGroup>
                          {allCoins.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={`${c.id} ${c.name} ${c.symbol}`}
                              onSelect={() => {
                                setForm((f) => ({
                                  ...f,
                                  coinId: c.id,
                                  symbol: c.symbol,
                                  name: c.name,
                                  // Prefill from /market/top — already loaded with the coin list.
                                  price:
                                    typeof c.price === "number" && Number.isFinite(c.price)
                                      ? c.price
                                      : f.price,
                                }));
                                setCoinOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", form.coinId === c.id ? "opacity-100" : "opacity-0")} />
                              <span className="truncate">{c.name}</span>
                              <span className="ml-2 text-muted-foreground">{c.symbol}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Pick the coin you bought or sold so we can match live prices on your Portfolio.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    step="any"
                    min={0}
                    placeholder="0"
                    value={form.quantity === undefined ? "" : form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value === "" ? undefined : Number(e.target.value) })}
                  />
                </div>
                <div className="sm:col-span-1">
                  <Label className="text-xs">Price (USD / coin)</Label>
                  <Input
                    type="number"
                    step="any"
                    min={0}
                    placeholder="0"
                    value={form.price === undefined ? "" : form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value === "" ? undefined : Number(e.target.value) })}
                  />
                  {form.coinId && form.price != null && (
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                      Filled from live market price — edit if your fill differed.
                    </p>
                  )}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label className="text-xs">Fees (optional)</Label>
                  <Input
                    type="number"
                    step="any"
                    min={0}
                    placeholder="0"
                    value={form.fees === undefined ? "" : form.fees}
                    onChange={(e) => setForm({ ...form, fees: e.target.value === "" ? undefined : Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {(["bullish", "bearish", "neutral"] as Sentiment[]).map((s) => (
              <button key={s} type="button" onClick={() => setForm({ ...form, sentiment: s })}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${form.sentiment === s ? sentimentConfig[s].color : "border-border text-muted-foreground"}`}>{s}</button>
            ))}
          </div>

          <div>
            <Label className="text-xs">Notes / Thesis</Label>
            <Textarea placeholder="Write your thoughts..." value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={4} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={!form.note.trim() || !tradeFieldsValid || submitting}>
              {submitting ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function PortfolioJournalPage() {
  const { logs, isLoading, error, filters, setFilters, createLog: createLogApi, deleteLog: deleteLogApi, refetch } = usePortfolioLogs();
  const { fetchPortfolio } = usePortfolio();

  const showReplayWarning = (warning: ReplayWarning) => {
    toast.warning("Holdings could not be updated", {
      description: warning.message,
      duration: 8000,
    });
  };

  const createLog = async (data: CreateLogRequest) => {
    try {
      const result = await createLogApi(data);
      await fetchPortfolio();
      if (result.replayWarning) {
        showReplayWarning(result.replayWarning);
      } else {
        toast.success("Journal entry saved");
      }
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error("Could not save entry", {
        description: apiErr?.message ?? "Something went wrong. Please try again.",
      });
      throw err;
    }
  };

  const deleteLog = async (id: string) => {
    try {
      const result = await deleteLogApi(id);
      await fetchPortfolio();
      if (result.replayWarning) {
        showReplayWarning(result.replayWarning);
      } else {
        toast.success("Journal entry deleted");
      }
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error("Could not delete entry", {
        description: apiErr?.message ?? "Something went wrong. Please try again.",
      });
      throw err;
    }
  };
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (error) return <ErrorCard message={error} onRetry={refetch} />;

  return (
    <PageTransition>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="section-heading">Portfolio Journal</h1>
          <p className="section-subheading">Log your trades, analysis, and market thoughts</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />New Entry
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 surface-soft p-3 sm:p-4">
        <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search logs..." value={filters.search || ""} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="pl-9" />
        </div>
        {(Object.keys(actionTypeConfig) as JournalActionType[]).map((type) => (
          <button key={type} onClick={() => setFilters({ ...filters, actionType: filters.actionType === type ? undefined : type })}
            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${filters.actionType === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{type}</button>
        ))}
        </div>
      </div>

      <div>
        {/* Logs */}
        <div>
          {isLoading ? <TableSkeleton rows={4} /> : !logs.length ? (
            <EmptyState title="No journal entries" description="Start logging your portfolio actions" actionLabel="Create First Entry" onAction={() => setShowCreate(true)} icon={<BookOpen className="h-8 w-8 text-muted-foreground" />} />
          ) : (
            <div className="space-y-3">
              {logs.map((log, i) => {
                const cfg = actionTypeConfig[log.actionType];
                const Icon = cfg.icon;
                return (
                  <FadeIn key={log.id} delay={i * 0.04}>
                    <div className="card-hover surface-card p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-md p-2 ${cfg.color}`}><Icon className="h-4 w-4" /></div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium capitalize text-card-foreground">{log.actionType}</span>
                              {log.symbol && <Badge variant="secondary" className="text-xs">{log.symbol}</Badge>}
                              {log.sentiment && <Badge variant="outline" className={`text-xs ${sentimentConfig[log.sentiment].color}`}>{sentimentConfig[log.sentiment].label}</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => setDeleteConfirmId(log.id)} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>

                      {(log.quantity || log.price) && (
                        <div className="mb-2 flex gap-4 text-xs text-muted-foreground">
                          {log.quantity && <span>Qty: <span className="font-mono text-card-foreground">{log.quantity}</span></span>}
                          {log.price && <span>Price: <span className="font-mono text-card-foreground">{formatCurrency(log.price)}</span></span>}
                          {log.fees && <span>Fees: <span className="font-mono text-card-foreground">{formatCurrency(log.fees)}</span></span>}
                        </div>
                      )}

                      <p className="text-sm text-card-foreground/90">{log.note}</p>

                      {log.tags && log.tags.length > 0 && (
                        <div className="mt-2 flex gap-1">
                          {log.tags.map((tag) => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                        </div>
                      )}
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && <CreateLogModal onClose={() => setShowCreate(false)} onSave={createLog} />}
      </AnimatePresence>

      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="z-[70]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this journal entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the entry from your journal and rebuilds your portfolio from the remaining buy and sell logs. You cannot undo this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={async () => {
                const id = deleteConfirmId;
                setDeleteConfirmId(null);
                if (!id) return;
                try {
                  await deleteLog(id);
                } catch {
                  // Caller already toasts; swallow to avoid an unhandled rejection.
                }
              }}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}
