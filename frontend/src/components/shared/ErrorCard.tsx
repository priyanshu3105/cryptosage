import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorCardProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorCard({ message = "Something went wrong", onRetry }: ErrorCardProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
      <AlertTriangle className="mb-3 h-10 w-10 text-destructive" />
      <p className="mb-1 text-sm font-medium text-foreground">{message}</p>
      <p className="mb-4 text-xs text-muted-foreground">Please try again or contact support.</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}
