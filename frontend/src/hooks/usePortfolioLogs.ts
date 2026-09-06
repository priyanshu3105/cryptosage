import { useState, useEffect, useCallback } from "react";
import type { PortfolioLog, JournalFilters, CreateLogRequest, ApiError } from "@/types";
import { apiClient, type ReplayWarning } from "@/services/api";

export type LogWriteResult = {
  replayWarning?: ReplayWarning;
};

export function usePortfolioLogs() {
  const [logs, setLogs] = useState<PortfolioLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<JournalFilters>({});

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (filters.search) query.set("search", filters.search);
      if (filters.actionType) query.set("actionTypes", filters.actionType);
      if (filters.sentiment) query.set("sentiment", filters.sentiment);
      if (filters.coinId) query.set("symbols", filters.coinId.toUpperCase());
      if (filters.dateFrom) query.set("from", filters.dateFrom);
      if (filters.dateTo) query.set("to", filters.dateTo);
      const endpoint = query.toString() ? `/portfolio/logs?${query.toString()}` : "/portfolio/logs";
      const response = await apiClient.getWithMeta<PortfolioLog[]>(endpoint);
      setLogs(
        response.data.map((log) => ({
          ...log,
          id: log.id || (log as PortfolioLog & { _id?: string })._id || "",
        }))
      );
    } catch (err) {
      setLogs([]);
      const apiErr = err as ApiError;
      setError(apiErr?.message ?? "Could not load journal. Is the API running?");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const filtered = logs;

  const createLog = async (data: CreateLogRequest): Promise<LogWriteResult> => {
    const response = await apiClient.postWithMeta<PortfolioLog>("/portfolio/logs", data);
    await fetchLogs();
    return { replayWarning: response.meta?.replayWarning };
  };

  const deleteLog = async (id: string): Promise<LogWriteResult> => {
    const response = await apiClient.deleteWithMeta<{ id: string }>(`/portfolio/logs/${id}`);
    await fetchLogs();
    return { replayWarning: response.meta?.replayWarning };
  };

  const updateLog = async (
    id: string,
    data: Partial<CreateLogRequest>
  ): Promise<LogWriteResult> => {
    const response = await apiClient.putWithMeta<PortfolioLog>(`/portfolio/logs/${id}`, data);
    await fetchLogs();
    return { replayWarning: response.meta?.replayWarning };
  };

  return {
    logs: filtered,
    allLogs: logs,
    isLoading,
    error,
    filters,
    setFilters,
    createLog,
    deleteLog,
    updateLog,
    refetch: fetchLogs,
  };
}
