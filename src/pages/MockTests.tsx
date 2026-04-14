import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, GraduationCap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface MockRow { id: string; name: string; exams: string[]; link: string; description: string; free: boolean; }

export default function MockTests() {
  const [mocks, setMocks] = useState<MockRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("mocks").select("*").order("created_at", { ascending: true }).then(({ data }) => {
      setMocks(data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="container py-10 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-3xl font-bold mb-1">Mock Tests</h1>
        <p className="text-muted-foreground mb-8">Sectional and full-length mocks from top platforms</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {mocks.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border bg-card p-6 flex flex-col card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent"><GraduationCap className="h-5 w-5" /></div>
              {m.free && <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30 text-xs">Free</Badge>}
            </div>
            <h3 className="font-heading font-bold text-lg mb-1">{m.name}</h3>
            <p className="text-sm text-muted-foreground mb-3 flex-1">{m.description}</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {m.exams.map(e => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}
            </div>
            <Button size="sm" asChild className="gap-1.5 w-full">
              <a href={m.link} target="_blank" rel="noopener noreferrer">Visit Platform <ExternalLink className="h-3.5 w-3.5" /></a>
            </Button>
          </motion.div>
        ))}
      </div>
      {mocks.length === 0 && <p className="text-center text-muted-foreground py-12">No mock tests added yet</p>}
    </div>
  );
}
