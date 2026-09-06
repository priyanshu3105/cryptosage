import { useState } from "react";
import { Link } from "react-router-dom";
import { PageTransition } from "@/components/shared/Animations";
import { User, Bell, Shield, KeyRound } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { ApiError } from "@/types";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const { user, resetSession, upgradeGuest, logout, isBusy } = useSession();
  const isGuest = Boolean(user?.isGuest);
  const [confirmReset, setConfirmReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [upgradeForm, setUpgradeForm] = useState({ name: "", email: "", password: "" });
  const [isUpgrading, setIsUpgrading] = useState(false);

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your session and account</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <User className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-sm font-medium text-card-foreground">Session</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Signed in as</span>
              <span className="text-right text-card-foreground">{user?.name ?? "Guest"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Account type</span>
              <span className="text-card-foreground">{isGuest ? "Guest" : "Registered"}</span>
            </div>
            {!isGuest && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Email</span>
                <span className="truncate text-right text-card-foreground">{user?.email}</span>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Session ID</span>
              <span className="font-mono text-xs text-card-foreground">{user?.id ?? "—"}</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {isGuest
              ? "You're browsing as a guest. Portfolio and journal work the same as a full account, but clearing this browser starts a new session."
              : "You're signed in with an account. Your portfolio and journal stay available when you log in on another device."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {isGuest ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/signup">Create account</Link>
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={isBusy}
                onClick={async () => {
                  await logout();
                }}
              >
                Sign out
              </Button>
            )}
          </div>
        </div>

        {isGuest && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <KeyRound className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-sm font-medium text-card-foreground">Keep this data</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Create an account on this guest session to keep your current portfolio, journal, and
              chat history.
            </p>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setIsUpgrading(true);
                try {
                  await upgradeGuest(upgradeForm);
                  toast.success("Account created — your data is saved");
                  setUpgradeForm({ name: "", email: "", password: "" });
                } catch (error) {
                  const apiError = error as ApiError;
                  toast.error(apiError.message || "Could not create account");
                } finally {
                  setIsUpgrading(false);
                }
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="upgrade-name">Name</Label>
                <Input
                  id="upgrade-name"
                  value={upgradeForm.name}
                  onChange={(e) => setUpgradeForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  minLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upgrade-email">Email</Label>
                <Input
                  id="upgrade-email"
                  type="email"
                  value={upgradeForm.email}
                  onChange={(e) => setUpgradeForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upgrade-password">Password</Label>
                <Input
                  id="upgrade-password"
                  type="password"
                  value={upgradeForm.password}
                  onChange={(e) => setUpgradeForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" disabled={isUpgrading || isBusy}>
                {isUpgrading ? "Saving…" : "Create account & keep data"}
              </Button>
            </form>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-sm font-medium text-card-foreground">Notifications</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Notification preferences will be available here.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-sm font-medium text-card-foreground">
              {isGuest ? "Reset session" : "Delete account data"}
            </h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Permanently delete this session&apos;s portfolio, journal entries and chat history
            {isGuest ? ", then start a fresh guest session." : "."}
          </p>
          <Button variant="destructive" onClick={() => setConfirmReset(true)}>
            {isGuest ? "Reset my data" : "Delete my data"}
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmReset} onOpenChange={(open) => !open && setConfirmReset(false)}>
        <AlertDialogContent className="z-[70]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isGuest ? "Reset this session?" : "Delete your data?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your portfolio, journal entries and chat history
              {isGuest ? ", and starts a new empty guest session." : "."} You cannot undo this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isResetting}
              onClick={async () => {
                setIsResetting(true);
                await resetSession();
                setIsResetting(false);
                setConfirmReset(false);
              }}
            >
              {isResetting ? "Working…" : isGuest ? "Reset" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}
