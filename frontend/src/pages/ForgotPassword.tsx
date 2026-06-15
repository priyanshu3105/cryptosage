import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email"); return; }
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success("Reset link sent!");
    } catch {
      toast.error("Failed to send reset link");
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <CheckCircle className="mx-auto mb-4 h-12 w-12 text-success" />
        <h2 className="mb-2 text-lg font-semibold text-foreground">Check your email</h2>
        <p className="mb-6 text-sm text-muted-foreground">We've sent a password reset link to {email}</p>
        <Link to="/login"><Button variant="outline" className="w-full"><ArrowLeft className="mr-2 h-4 w-4" />Back to login</Button></Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Reset password</h2>
        <p className="text-sm text-muted-foreground">Enter your email to receive a reset link</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} className={error ? "border-destructive" : ""} />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Send reset link
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link to="/login" className="text-primary hover:underline">Back to login</Link>
      </p>
    </form>
  );
}
