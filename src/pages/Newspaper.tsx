import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Newspaper, ExternalLink, Calendar, Settings, Plus, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface NewsItem { id: string; title: string; description: string; link: string; date: string; source: string; }

const normalizeUrl = (url: string) => {
  if (!url) return "#";
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

import { useAuth } from "@/hooks/useAuth";
import { FileUpload } from "@/components/FileUpload";

export default function NewspaperPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [manage, setManage] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fTitle, setFTitle] = useState("");
  const [fLink, setFLink] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fSource, setFSource] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("news").select("*").order("date", { ascending: false });
    if (error) toast.error("Failed to load news");
    else setItems((data || []) as NewsItem[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!fTitle.trim() || !fLink.trim()) { toast.error("Title and link required"); return; }
    const { error } = await supabase.from("news").insert({ title: fTitle.trim(), description: fDesc.trim(), link: fLink.trim(), source: fSource.trim() || "Custom", date: today });
    if (error) { toast.error("Failed to add"); return; }
    setFTitle(""); setFLink(""); setFDesc(""); setFSource(""); setShowForm(false); toast.success("News added!"); load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("news").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Deleted"); load();
  };

  const todayNews = items.filter(n => n.date === today);
  const olderNews = items.filter(n => n.date !== today);

  const renderCard = (n: NewsItem, i: number) => (
    <motion.div key={n.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="relative rounded-xl border bg-card p-6 flex flex-col card-hover">
      {manage && (
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
        <Button size="sm" asChild className="gap-1.5"><a href={normalizeUrl(n.link)} target="_blank" rel="noopener noreferrer">Read Now <ExternalLink className="h-3.5 w-3.5" /></a></Button>
      </div>
    </motion.div>
  );

  return (
    <div className="container py-10 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-3xl font-bold mb-1">Newspaper & Editorials</h1>
        <p className="text-muted-foreground mb-4">Daily reading material to boost your VARC skills</p>
        {isAdmin && (<Button variant="ghost" size="sm" className="mb-6 gap-1.5 text-xs text-muted-foreground" onClick={() => setManage(m => !m)}>
          <Settings className="h-3.5 w-3.5" /> {manage ? "Hide Manage" : "Manage"}
        </Button>)}
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
                <div className="space-y-1"><Label className="text-xs">Link</Label><div className="flex gap-2"><Input value={fLink} onChange={e => setFLink(e.target.value)} placeholder="https:// or upload" className="h-9" /><FileUpload onUploaded={setFLink} /></div></div>
                <div className="space-y-1"><Label className="text-xs">Description</Label><Input value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Short description" className="h-9" /></div>
                <div className="space-y-1"><Label className="text-xs">Source</Label><Input value={fSource} onChange={e => setFSource(e.target.value)} placeholder="e.g. The Hindu" className="h-9" /></div>
              </div>
              <Button size="sm" onClick={handleAdd} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Save</Button>
            </div>
          )}
        </div>
      )}

      {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : items.length === 0 ? <p className="text-sm text-muted-foreground">No news yet.</p> : (
        <>
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
        </>
      )}
    </div>
  );
}
