import { useState } from "react";
import { getStoredVideos, addVideo, deleteVideo } from "@/lib/videoStorage";
import { getYoutubeId } from "@/data/videos_data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const TOPICS = ["Arithmetic", "Algebra", "Geometry", "Number System", "Modern Math", "Permutation & Combination"];

export default function ManageVideos() {
  const [videos, setVideos] = useState(getStoredVideos());
  const [topic, setTopic] = useState(TOPICS[0]);
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [link, setLink] = useState("");

  const handleAdd = () => {
    if (!title.trim() || !link.trim()) {
      toast.error("Title and YouTube link are required");
      return;
    }
    const updated = addVideo({ topic, title: title.trim(), creator: creator.trim() || "Unknown", link: link.trim() });
    setVideos(updated);
    setTitle(""); setCreator(""); setLink("");
    toast.success("Video added!");
  };

  const handleDelete = (idx: number) => {
    const updated = deleteVideo(idx);
    setVideos(updated);
    toast.success("Video deleted");
  };

  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? videos : videos.filter(v => v.topic === filter);

  return (
    <div className="container py-10 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Video className="h-6 w-6 text-accent" />
        <h1 className="font-heading text-2xl font-bold">Manage Videos</h1>
        <Badge variant="secondary" className="ml-2">{videos.length} total</Badge>
      </div>

      {/* Add Form */}
      <div className="rounded-xl border bg-card p-5 mb-8 space-y-4">
        <h2 className="font-semibold text-lg">Add New Video</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Topic</Label>
            <select value={topic} onChange={e => setTopic(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Video title" />
          </div>
          <div className="space-y-1.5">
            <Label>Creator</Label>
            <Input value={creator} onChange={e => setCreator(e.target.value)} placeholder="e.g. Ravi Sir" />
          </div>
          <div className="space-y-1.5">
            <Label>YouTube Link</Label>
            <Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
          </div>
        </div>
        {link && (
          <div className="flex items-center gap-3">
            <img src={`https://img.youtube.com/vi/${getYoutubeId(link)}/maxresdefault.jpg`} alt="Thumbnail" className="h-16 rounded" />
            <span className="text-xs text-muted-foreground">Thumbnail preview</span>
          </div>
        )}
        <Button onClick={handleAdd} className="gap-1.5"><Plus className="h-4 w-4" /> Save Video</Button>
      </div>

      {/* Filter & List */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["All", ...TOPICS].map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${filter === t ? "bg-accent text-accent-foreground border-accent" : "bg-secondary/40 border-border hover:bg-accent/15"}`}>{t}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((v, i) => {
          const realIdx = videos.indexOf(v);
          return (
            <div key={`${v.topic}-${v.title}-${i}`} className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <img src={`https://img.youtube.com/vi/${getYoutubeId(v.link)}/mqdefault.jpg`} alt="" className="h-12 w-20 rounded object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{v.title}</p>
                <p className="text-xs text-muted-foreground">{v.topic} • {v.creator}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(realIdx)} className="shrink-0 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No videos found</p>}
      </div>
    </div>
  );
}
