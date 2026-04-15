import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ExternalLink, GraduationCap, Loader2, Settings, Plus, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface MockRow { id: string; name: string; exams: string[]; link: string; description: string; free: boolean; }

export default function MockTests() {
  const [mocks, setMocks] = useState<MockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [manage, setManage] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [exams, setExams] = useState("");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [free, setFree] = useState(false);

  const fetchMocks = async () => {
    const { data } = await supabase.from("mocks").select("*").order("created_at", { ascending: true });
    setMocks(data || []); setLoading(false);
  };
  useEffect(() => { fetchMocks(); }, []);

  const handleAdd = async () => {
    if (!name.trim() || !link.trim()) { toast.error("Name and link required"); return; }
    const examsArr = exams.split(",").map(e => e.trim()).filter(Boolean);
    if (examsArr.length === 0) { toast.error("Add at least one exam"); return; }
    const { error } = await supabase.from("mocks").insert({ name: name.trim(), exams: examsArr, link: link.trim(), description: description.trim(), free });
    if (error) { toast.error("Failed to add"); return; }
    setName(""); setExams(""); setLink(""); setDescription(""); setFree(false); setShowForm(false);
    toast.success("Mock added!"); fetchMocks();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("mocks").delete().eq("id", id);
    toast.success("Deleted"); fetchMocks();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="container py-10 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-3xl font-bold mb-1">Mock Tests</h1>
        <p className="text-muted-foreground mb-4">Sectional and full-length mocks from top platforms</p>
        <Button variant="ghost" size="sm" className="mb-6 gap-1.5 text-xs text-muted-foreground" onClick={() => setManage(m => !m)}>
          <Settings className="h-3.5 w-3.5" /> {manage ? "Hide Manage" : "Manage"}
        </Button>
      </motion.div>

      {manage && (
        <div className="mb-6 space-y-3">
          {!showForm ? (
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Mock</Button>
          ) : (
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex justify-between items-center"><h3 className="font-semibold text-sm">Add Mock Source</h3><Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Platform Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Unacademy" className="h-9" /></div>
                <div className="space-y-1"><Label className="text-xs">Exams (comma separated)</Label><Input value={exams} onChange={e => setExams(e.target.value)} placeholder="CAT, XAT, IIFT" className="h-9" /></div>
                <div className="space-y-1"><Label className="text-xs">Link</Label><Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." className="h-9" /></div>
                <div className="space-y-1"><Label className="text-xs">Description</Label><Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description" className="h-9" /></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={free} onCheckedChange={setFree} /><Label className="text-xs">Free platform</Label></div>
              <Button size="sm" onClick={handleAdd} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Save</Button>
            </div>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {mocks.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="relative rounded-xl border bg-card p-6 flex flex-col card-hover">
            {manage && (
              <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 z-10" onClick={() => handleDelete(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            )}
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
