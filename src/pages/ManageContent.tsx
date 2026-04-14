import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getYoutubeId } from "@/data/videos_data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Video, Loader2, GraduationCap, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const VIDEO_TOPICS = ["Arithmetic", "Algebra", "Geometry", "Number System", "Modern Math", "Permutation & Combination"];

interface VideoRow { id: string; topic: string; title: string; creator: string; link: string; }
interface MockRow { id: string; name: string; exams: string[]; link: string; description: string; free: boolean; }

function ManageVideosTab() {
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState(VIDEO_TOPICS[0]);
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [link, setLink] = useState("");
  const [filter, setFilter] = useState("All");

  const fetch_ = async () => {
    const { data } = await supabase.from("videos").select("id, topic, title, creator, link").order("created_at", { ascending: true });
    setVideos(data || []); setLoading(false);
  };
  useEffect(() => { fetch_(); }, []);

  const handleAdd = async () => {
    if (!title.trim() || !link.trim()) { toast.error("Title and YouTube link required"); return; }
    const { error } = await supabase.from("videos").insert({ topic, title: title.trim(), creator: creator.trim() || "Unknown", link: link.trim() });
    if (error) { toast.error("Failed to add"); return; }
    setTitle(""); setCreator(""); setLink(""); toast.success("Video added!"); fetch_();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("videos").delete().eq("id", id);
    toast.success("Deleted"); fetch_();
  };

  const filtered = filter === "All" ? videos : videos.filter(v => v.topic === filter);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-lg">Add New Video</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Topic</Label>
            <select value={topic} onChange={e => setTopic(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {VIDEO_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Video title" /></div>
          <div className="space-y-1.5"><Label>Creator</Label><Input value={creator} onChange={e => setCreator(e.target.value)} placeholder="e.g. Ravi Sir" /></div>
          <div className="space-y-1.5"><Label>YouTube Link</Label><Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://youtube.com/watch?v=..." /></div>
        </div>
        {link && <img src={`https://img.youtube.com/vi/${getYoutubeId(link)}/mqdefault.jpg`} alt="" className="h-16 rounded" />}
        <Button onClick={handleAdd} className="gap-1.5"><Plus className="h-4 w-4" /> Save Video</Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {["All", ...VIDEO_TOPICS].map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${filter === t ? "bg-accent text-accent-foreground border-accent" : "bg-secondary/40 border-border hover:bg-accent/15"}`}>{t}</button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
        <div className="space-y-2">
          {filtered.map(v => (
            <div key={v.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <img src={`https://img.youtube.com/vi/${getYoutubeId(v.link)}/mqdefault.jpg`} alt="" className="h-12 w-20 rounded object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{v.title}</p>
                <p className="text-xs text-muted-foreground">{v.topic} • {v.creator}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)} className="shrink-0 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No videos found</p>}
        </div>
      )}
    </div>
  );
}

function ManageMocksTab() {
  const [mocks, setMocks] = useState<MockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [exams, setExams] = useState("");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [free, setFree] = useState(false);

  const fetch_ = async () => {
    const { data } = await supabase.from("mocks").select("*").order("created_at", { ascending: true });
    setMocks(data || []); setLoading(false);
  };
  useEffect(() => { fetch_(); }, []);

  const handleAdd = async () => {
    if (!name.trim() || !link.trim()) { toast.error("Name and link required"); return; }
    const examsArr = exams.split(",").map(e => e.trim()).filter(Boolean);
    if (examsArr.length === 0) { toast.error("Add at least one exam"); return; }
    const { error } = await supabase.from("mocks").insert({ name: name.trim(), exams: examsArr, link: link.trim(), description: description.trim(), free });
    if (error) { toast.error("Failed to add"); return; }
    setName(""); setExams(""); setLink(""); setDescription(""); setFree(false);
    toast.success("Mock added!"); fetch_();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("mocks").delete().eq("id", id);
    toast.success("Deleted"); fetch_();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-lg">Add New Mock Source</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>Platform Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Unacademy" /></div>
          <div className="space-y-1.5"><Label>Exams (comma separated)</Label><Input value={exams} onChange={e => setExams(e.target.value)} placeholder="CAT, XAT, IIFT" /></div>
          <div className="space-y-1.5"><Label>Link</Label><Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." /></div>
          <div className="space-y-1.5"><Label>Description</Label><Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description" /></div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={free} onCheckedChange={setFree} />
          <Label>Free platform</Label>
        </div>
        <Button onClick={handleAdd} className="gap-1.5"><Plus className="h-4 w-4" /> Save Mock</Button>
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
        <div className="space-y-2">
          {mocks.map(m => (
            <div key={m.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0"><GraduationCap className="h-5 w-5" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.name} {m.free && <Badge className="bg-green-500/15 text-green-600 border-green-500/30 text-xs ml-1">Free</Badge>}</p>
                <p className="text-xs text-muted-foreground">{m.exams.join(", ")} • {m.description}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} className="shrink-0 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          {mocks.length === 0 && <p className="text-center text-muted-foreground py-8">No mocks found</p>}
        </div>
      )}
    </div>
  );
}

export default function ManageContent() {
  const [tab, setTab] = useState<"videos" | "mocks">("videos");

  return (
    <div className="container py-10 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6 text-accent" />
        <h1 className="font-heading text-2xl font-bold">Manage Content</h1>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("videos")} className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "videos" ? "bg-accent text-accent-foreground" : "bg-secondary/40 hover:bg-accent/15"}`}>
          <Video className="h-4 w-4" /> Videos
        </button>
        <button onClick={() => setTab("mocks")} className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "mocks" ? "bg-accent text-accent-foreground" : "bg-secondary/40 hover:bg-accent/15"}`}>
          <GraduationCap className="h-4 w-4" /> Mock Tests
        </button>
      </div>

      {tab === "videos" ? <ManageVideosTab /> : <ManageMocksTab />}
    </div>
  );
}
