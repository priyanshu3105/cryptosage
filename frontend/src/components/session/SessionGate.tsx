import { useSession } from "@/contexts/SessionContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

/**
 * Holds the app back until a session exists, so user-scoped requests
 * never fire before there is a token to send with them.
 */
export function SessionGate({ children }: { children: React.ReactNode }) {
  const { isReady, user, error, continueAsGuest, isBusy } = useSession();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-4 text-center">
          <h1 className="text-xl font-semibold text-foreground">Session unavailable</h1>
          <p className="text-sm text-muted-foreground">
            {error ?? "Could not start a guest session. Check that the API and MongoDB are running."}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              disabled={isBusy}
              onClick={async () => {
                try {
                  await continueAsGuest();
                } catch {
                  // error already stored on context
                }
              }}
            >
              Try guest again
            </Button>
            <Button variant="outline" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
