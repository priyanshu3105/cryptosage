import { AlertTriangle } from "lucide-react";

export function Disclaimer() {
  return (
    <div className="flex items-start gap-2 rounded-md border border-warning/20 bg-warning/5 p-3 text-xs text-muted-foreground">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-warning" />
      <p>This is not financial advice. All information is for educational purposes only. Always do your own research before making investment decisions.</p>
    </div>
  );
}
