import { useState } from "react";
import { newsData as defaultNews, type NewsItem } from "@/data/news_data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Newspaper, ExternalLink, Calendar, Settings, Plus, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const STORAGE_KEY = "newsData";
function getStored(): NewsItem[] { try { const s = localStorage.getItem(STORAGE_KEY); if (s) return JSON.parse(s); } catch {} return []; }
function saveStored(d: NewsItem[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

export default function NewspaperPage() {
  const [extra, setExtra] = useState<NewsItem[]>(getStored);
  const all = [...defaultNews, ...extra];
  const [manage, setManage] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fTitle, setFTitle] = useState("");
  const [fLink, setFLink] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fSource, setFSource] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const todayNews = all.filter(n => n.date === today);
  const olderNews = all.filter(n => n.date !== today);

  const handleAdd = () => {
    if (!fTitle.trim() || !fLink.trim()) { toast.error("Title and link required"); return; }
    const n: NewsItem = { id: `n_${Date.now()}`, title: fTitle.trim(), description: fDesc.trim(), link: fLink.trim(), date: today, source: fSource.trim() || "Custom" };
    const updated = [...extra, n]; setExtra(updated); saveStored(updated);
    setFTitle(""); setFLink(""); setFDesc(""); setFSource(""); setShowForm(false); toast.success("News added!");
  };

  const handleDelete = (id: string) => {
    const updated = extra.filter(n => n.id !== id); setExtra(updated); saveStored(updated); toast.success("Deleted");
  };

  const renderCard = (n: NewsItem, i: number) => (
    <motion.div key={n.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="relative rounded-xl border bg-card p-6 flex flex-col card-hover">
      {manage && extra.some(e => e.id === n.id) && (
        <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 z-10" onClick={() => handleDelete(n.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent"><Newspaper className="h-4 w-4" /></div>
        <Badge variant="secondary" className="text-xs">{n.source}</Badge>
      </div>
      <h3 className="font-heading font-semibold mb-1">{n.title}</h3>
      <p className="text-sm text-muted-foreground mb-4 flex-1">{n.description}</p>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" /> {n.date}</span>
        <Button size="sm" asChild className="gap-1.5"><a href={n.link} target="_blank" rel="noopener noreferrer">Read Now <ExternalLink className="h-3.5 w-3.5" /></a></Button>
      </div>
    </motion.div>
  );

  return (
    <div className="container py-10 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-3xl font-bold mb-1">Newspaper & Editorials</h1>
        <p className="text-muted-foreground mb-4">Daily reading material to boost your VARC skills</p>
        <Button variant="ghost" size="sm" className="mb-6 gap-1.5 text-xs text-muted-foreground" onClick={() => setManage(m => !m)}>
          <Settings className="h-3.5 w-3.5" /> {manage ? "Hide Manage" : "Manage"}
        </Button>
      </motion.div>

      {manage && (
        <div className="mb-6 space-y-3">
          {!showForm ? (
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add News</Button>
          ) : (
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex justify-between items-center"><h3 className="font-semibold text-sm">Add News Item</h3><Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="Article title" className="h-9" /></div>
                <div className="space-y-1"><Label className="text-xs">Link</Label><Input value={fLink} onChange={e => setFLink(e.target.value)} placeholder="https://..." className="h-9" /></div>
                <div className="space-y-1"><Label className="text-xs">Description</Label><Input value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Short description" className="h-9" /></div>
                <div className="space-y-1"><Label className="text-xs">Source</Label><Input value={fSource} onChange={e => setFSource(e.target.value)} placeholder="e.g. The Hindu" className="h-9" /></div>
              </div>
              <Button size="sm" onClick={handleAdd} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Save</Button>
            </div>
          )}
        </div>
      )}

      {todayNews.length > 0 && (
        <>
          <h2 className="font-heading text-lg font-semibold mb-4">Today's Picks</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">{todayNews.map(renderCard)}</div>
        </>
      )}
      {olderNews.length > 0 && (
        <>
          <h2 className="font-heading text-lg font-semibold mb-4">Previous Days</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{olderNews.map(renderCard)}</div>
        </>
      )}
    </div>
  );
}
