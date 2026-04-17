import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Mode = "login" | "signup" | "forgot";

export default function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) nav("/");
    });
  }, [nav]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) toast.error(error.message);
        else { toast.success("Logged in"); nav("/"); }
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/` } });
        if (error) toast.error(error.message);
        else toast.success("Account created — you can log in now");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) toast.error(error.message);
        else toast.success("Password reset link sent — check your email");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error("Google sign-in failed");
  };

  return (
    <div className="container max-w-md py-16">
      <h1 className="font-heading text-3xl font-bold mb-6">
        {mode === "login" ? "Log in" : mode === "signup" ? "Sign up" : "Reset password"}
      </h1>

      <Button type="button" variant="outline" className="w-full mb-4" onClick={handleGoogle}>
        Continue with Google
      </Button>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">OR</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handle} className="space-y-4">
        <div className="space-y-1">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        {mode !== "forgot" && (
          <div className="space-y-1">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "..." : mode === "login" ? "Log in" : mode === "signup" ? "Sign up" : "Send reset link"}
        </Button>
      </form>

      <div className="flex flex-col gap-2 mt-4 text-sm">
        {mode === "login" && (
          <>
            <button type="button" onClick={() => setMode("forgot")} className="text-muted-foreground hover:underline text-left">
              Forgot password?
            </button>
            <button type="button" onClick={() => setMode("signup")} className="text-muted-foreground hover:underline text-left">
              Need an account? Sign up
            </button>
          </>
        )}
        {mode === "signup" && (
          <button type="button" onClick={() => setMode("login")} className="text-muted-foreground hover:underline text-left">
            Have an account? Log in
          </button>
        )}
        {mode === "forgot" && (
          <button type="button" onClick={() => setMode("login")} className="text-muted-foreground hover:underline text-left">
            Back to log in
          </button>
        )}
      </div>
    </div>
  );
}
