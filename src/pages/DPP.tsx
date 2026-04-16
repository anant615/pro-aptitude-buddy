import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, Settings, Plus, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface DPPRow { id: string; date: string; title: string; question: string; }
interface DPPDay { date: string; title: string; questions: { id: string; question: string }[]; }

export default function DPP() {
  const [rows, setRows] = useState<DPPRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [manage, setManage] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fDate, setFDate] = useState("");
  const [fTitle, setFTitle] = useState("");
  const [fQuestion, setFQuestion] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("dpps").select("*").order("date", { ascending: false });
    if (error) toast.error("Failed to load DPPs");
    else setRows((data || []) as DPPRow[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Group by date+title
  const allDpp: DPPDay[] = useMemo(() => {
    const map = new Map<string, DPPDay>();
    for (const r of rows) {
      const key = `${r.date}__${r.title}`;
      if (!map.has(key)) map.set(key, { date: r.date, title: r.title, questions: [] });
      map.get(key)!.questions.push({ id: r.id, question: r.question });
    }
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [rows]);

  const currentDPP = allDpp.find((d) => d.date === (selectedDay || today)) || allDpp[0];

  const handleAdd = async () => {
    if (!fDate || !fTitle.trim() || !fQuestion.trim()) { toast.error("All fields required"); return; }
    const { error } = await supabase.from("dpps").insert({ date: fDate, title: fTitle.trim(), question: fQuestion.trim() });
    if (error) { toast.error("Failed to add"); return; }
    setFDate(""); setFTitle(""); setFQuestion(""); setShowForm(false); toast.success("DPP added!"); load();
  };

  const handleDeleteQuestion = async (id: string) => {
    const { error } = await supabase.from("dpps").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Deleted"); load();
  };

  return (
    <div className="container py-10 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Badge variant="secondary" className="mb-3 gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Daily Practice</Badge>
        <h1 className="font-heading text-3xl font-bold mb-1">Daily Practice Problems (DPP)</h1>
        <p className="text-muted-foreground mb-4">Fresh questions daily for CAT 2026 & OMET preparation</p>
        <Button variant="ghost" size="sm" className="mb-6 gap-1.5 text-xs text-muted-foreground" onClick={() => setManage(m => !m)}>
          <Settings className="h-3.5 w-3.5" /> {manage ? "Hide Manage" : "Manage"}
        </Button>
      </motion.div>

      {manage && (
        <div className="mb-6 space-y-3">
          {!showForm ? (
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add DPP</Button>
          ) : (
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex justify-between items-center"><h3 className="font-semibold text-sm">Add DPP</h3><Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Date</Label><Input type="date" value={fDate} onChange={e => setFDate(e.target.value)} className="h-9" /></div>
                <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="e.g. Arithmetic Mix" className="h-9" /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Question (text)</Label><Input value={fQuestion} onChange={e => setFQuestion(e.target.value)} placeholder="Enter question text" className="h-9" /></div>
              <Button size="sm" onClick={handleAdd} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Save</Button>
            </div>
          )}
        </div>
      )}

      {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : allDpp.length === 0 ? <p className="text-sm text-muted-foreground">No DPPs yet.</p> : (
        <>
          <div className="flex flex-wrap gap-2 mb-8">
            {allDpp.map((d) => (
              <Button
                key={d.date + d.title}
                variant={(selectedDay || today) === d.date ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDay(d.date)}
                className="gap-1.5"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span className="text-foreground">{d.date === today ? "Today" : d.date}</span>
              </Button>
            ))}
          </div>

          {currentDPP && (
            <>
              <div className="rounded-xl border bg-card p-5 mb-6">
                <h2 className="font-heading font-semibold text-lg">{currentDPP.title}</h2>
                <p className="text-sm text-muted-foreground">{currentDPP.date} · {currentDPP.questions.length} questions</p>
              </div>

              <div className="space-y-6">
                <AnimatePresence>
                  {currentDPP.questions.map((q, qi) => (
                    <motion.div key={q.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qi * 0.05 }} className="relative rounded-xl border bg-card p-6">
                      {manage && (
                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 z-10" onClick={() => handleDeleteQuestion(q.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium text-muted-foreground">Q{qi + 1}</span>
                      </div>
                      <p className="font-medium">{q.question}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
