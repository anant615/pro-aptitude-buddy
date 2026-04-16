import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, BookOpen, Wrench, Table, ExternalLink, Settings, Plus, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

type ResourceType = "pdf" | "article" | "tool" | "sheet";
interface Resource { id: string; title: string; description: string; link: string; type: string; }

const typeIcons: Record<string, React.ReactNode> = { pdf: <FileText className="h-5 w-5" />, article: <BookOpen className="h-5 w-5" />, tool: <Wrench className="h-5 w-5" />, sheet: <Table className="h-5 w-5" /> };
const typeColors: Record<string, string> = { pdf: "bg-destructive/10 text-destructive", article: "bg-accent/10 text-accent", tool: "bg-green-500/10 text-green-600 dark:text-green-400", sheet: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
const TYPES: ResourceType[] = ["pdf", "article", "tool", "sheet"];

import { useAuth } from "@/hooks/useAuth";
import { FileUpload } from "@/components/FileUpload";

export default function Resources() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [manage, setManage] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fTitle, setFTitle] = useState("");
  const [fLink, setFLink] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fType, setFType] = useState<ResourceType>("pdf");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("resources").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Failed to load resources");
    else setItems((data || []) as Resource[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!fTitle.trim() || !fLink.trim()) { toast.error("Title and link required"); return; }
    const { error } = await supabase.from("resources").insert({ title: fTitle.trim(), description: fDesc.trim(), link: fLink.trim(), type: fType });
    if (error) { toast.error("Failed to add"); return; }
    setFTitle(""); setFLink(""); setFDesc(""); setShowForm(false); toast.success("Resource added!"); load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Deleted"); load();
  };

  return (
    <div className="container py-10 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-3xl font-bold mb-1">Resources</h1>
        <p className="text-muted-foreground mb-4">Curated study material, formula sheets, and tools</p>
        {isAdmin && (<Button variant="ghost" size="sm" className="mb-6 gap-1.5 text-xs text-muted-foreground" onClick={() => setManage(m => !m)}>
          <Settings className="h-3.5 w-3.5" /> {manage ? "Hide Manage" : "Manage"}
        </Button>)}
      </motion.div>

      {manage && (
        <div className="mb-6 space-y-3">
          {!showForm ? (
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Resource</Button>
          ) : (
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex justify-between items-center"><h3 className="font-semibold text-sm">Add Resource</h3><Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="Resource title" className="h-9" /></div>
                <div className="space-y-1"><Label className="text-xs">Link</Label><Input value={fLink} onChange={e => setFLink(e.target.value)} placeholder="https://..." className="h-9" /></div>
                <div className="space-y-1"><Label className="text-xs">Description</Label><Input value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Short description" className="h-9" /></div>
                <div className="space-y-1"><Label className="text-xs">Type</Label>
                  <select value={fType} onChange={e => setFType(e.target.value as ResourceType)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">{TYPES.map(t => <option key={t}>{t}</option>)}</select>
                </div>
              </div>
              <Button size="sm" onClick={handleAdd} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Save</Button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No resources yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="relative rounded-xl border bg-card p-6 flex flex-col card-hover">
              {manage && (
                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 z-10" onClick={() => handleDelete(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              )}
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-4 ${typeColors[r.type] || typeColors.pdf}`}>{typeIcons[r.type] || typeIcons.pdf}</div>
              <h3 className="font-heading font-semibold mb-1">{r.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 flex-1">{r.description}</p>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs capitalize">{r.type}</Badge>
                <Button size="sm" variant="outline" asChild className="gap-1.5"><a href={r.link} target="_blank" rel="noopener noreferrer">Open <ExternalLink className="h-3.5 w-3.5" /></a></Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
