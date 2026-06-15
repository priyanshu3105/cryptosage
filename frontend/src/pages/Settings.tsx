import { PageTransition } from "@/components/shared/Animations";
import { Settings as SettingsIcon, User, Bell, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account preferences</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><User className="h-4 w-4 text-primary" /></div>
            <h2 className="text-sm font-medium text-card-foreground">Profile</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="text-card-foreground">{user?.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="text-card-foreground">{user?.email}</span></div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><Bell className="h-4 w-4 text-primary" /></div>
            <h2 className="text-sm font-medium text-card-foreground">Notifications</h2>
          </div>
          <p className="text-sm text-muted-foreground">Notification preferences will be available here.</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><Shield className="h-4 w-4 text-primary" /></div>
            <h2 className="text-sm font-medium text-card-foreground">Security</h2>
          </div>
          <p className="text-sm text-muted-foreground">Security settings will be available here.</p>
        </div>
      </div>
    </PageTransition>
  );
}
