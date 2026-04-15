import { useState } from "react";
import { resourcesData as defaultResources, type Resource } from "@/data/resources_data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, BookOpen, Wrench, Table, ExternalLink, Settings, Plus, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const STORAGE_KEY = "resourcesData";
function getStored(): Resource[] { try { const s = localStorage.getItem(STORAGE_KEY); if (s) return JSON.parse(s); } catch {} return []; }
function saveStored(d: Resource[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

const typeIcons: Record<string, React.ReactNode> = { pdf: <FileText className="h-5 w-5" />, article: <BookOpen className="h-5 w-5" />, tool: <Wrench className="h-5 w-5" />, sheet: <Table className="h-5 w-5" /> };
const typeColors: Record<string, string> = { pdf: "bg-destructive/10 text-destructive", article: "bg-accent/10 text-accent", tool: "bg-green-500/10 text-green-600 dark:text-green-400", sheet: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
const TYPES: Resource["type"][] = ["pdf", "article", "tool", "sheet"];

export default function Resources() {
  const [extra, setExtra] = useState<Resource[]>(getStored);
  const all = [...defaultResources, ...extra];
  const [manage, setManage] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fTitle, setFTitle] = useState("");
  const [fLink, setFLink] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fType, setFType] = useState<Resource["type"]>("pdf");

  const handleAdd = () => {
    if (!fTitle.trim() || !fLink.trim()) { toast.error("Title and link required"); return; }
    const r: Resource = { id: `r_${Date.now()}`, title: fTitle.trim(), description: fDesc.trim(), link: fLink.trim(), type: fType };
    const updated = [...extra, r]; setExtra(updated); saveStored(updated);
    setFTitle(""); setFLink(""); setFDesc(""); setShowForm(false); toast.success("Resource added!");
  };

  const handleDelete = (id: string) => {
    const updated = extra.filter(r => r.id !== id); setExtra(updated); saveStored(updated); toast.success("Deleted");
  };

  return (
    <div className="container py-10 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-3xl font-bold mb-1">Resources</h1>
        <p className="text-muted-foreground mb-4">Curated study material, formula sheets, and tools</p>
        <Button variant="ghost" size="sm" className="mb-6 gap-1.5 text-xs text-muted-foreground" onClick={() => setManage(m => !m)}>
          <Settings className="h-3.5 w-3.5" /> {manage ? "Hide Manage" : "Manage"}
        </Button>
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
                  <select value={fType} onChange={e => setFType(e.target.value as Resource["type"])} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">{TYPES.map(t => <option key={t}>{t}</option>)}</select>
                </div>
              </div>
              <Button size="sm" onClick={handleAdd} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Save</Button>
            </div>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {all.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="relative rounded-xl border bg-card p-6 flex flex-col card-hover">
            {manage && extra.some(e => e.id === r.id) && (
              <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 z-10" onClick={() => handleDelete(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            )}
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-4 ${typeColors[r.type]}`}>{typeIcons[r.type]}</div>
            <h3 className="font-heading font-semibold mb-1">{r.title}</h3>
            <p className="text-sm text-muted-foreground mb-4 flex-1">{r.description}</p>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs capitalize">{r.type}</Badge>
              <Button size="sm" variant="outline" asChild className="gap-1.5"><a href={r.link} target="_blank" rel="noopener noreferrer">Open <ExternalLink className="h-3.5 w-3.5" /></a></Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
