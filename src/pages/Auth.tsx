import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
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
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else { toast.success("Logged in"); nav("/"); }
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/` } });
      if (error) toast.error(error.message);
      else toast.success("Account created — you can log in now");
    }
    setLoading(false);
  };

  return (
    <div className="container max-w-md py-16">
      <h1 className="font-heading text-3xl font-bold mb-6">{mode === "login" ? "Log in" : "Sign up"}</h1>
      <form onSubmit={handle} className="space-y-4">
        <div className="space-y-1"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
        <div className="space-y-1"><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} /></div>
        <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : mode === "login" ? "Log in" : "Sign up"}</Button>
      </form>
      <button type="button" onClick={() => setMode(m => m === "login" ? "signup" : "login")} className="text-sm text-muted-foreground mt-4 hover:underline">
        {mode === "login" ? "Need an account? Sign up" : "Have an account? Log in"}
      </button>
    </div>
  );
}
