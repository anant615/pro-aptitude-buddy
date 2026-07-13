import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, ExternalLink, CheckCircle2, XCircle, Loader2, Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { EditableText } from "@/components/EditableText";

export type MockEntry = {
  id: string;
  exam: string;
  institute: string;
  mock_name: string;
  institute_logo_url: string | null;
  official_link: string;
  price_inr: number;
  is_free: boolean;
  free_mocks_count: number;
  total_mocks_count: number;
  difficulty: string;
  exam_similarity_pct: number;
  overall_rating: number;
  question_quality: number;
  sectional_analysis: number;
  dashboard_experience: number;
  price_value: number;
  best_for: string | null;
  analysis_quality: string | null;
  pros: string[];
  cons: string[];
  category_tags: string[];
  featured_rank: number | null;
  is_sponsored: boolean;
  screenshots: string[];
  description: string | null;
};

const EXAMS = ["CAT", "SNAP", "NMAT", "XAT"];
const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Easy",
  moderate: "Moderate",
  "actual-cat": "Actual Exam Level",
  "above-cat": "Above Exam Level",
};

export default function MockHub() {
  const { isAdmin } = useAuth();
  const [entries, setEntries] = useState<MockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState("CAT");

  const load = async () => {
    const { data, error } = await supabase.from("mock_hub_entries" as any).select("*").order("featured_rank", { ascending: true, nullsFirst: false });
    if (error) toast.error("Failed to load mocks");
    setEntries(((data as any) || []) as MockEntry[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const examEntries = useMemo(() => entries.filter(e => e.exam === activeExam), [entries, activeExam]);

  const updateField = async (id: string, patch: Partial<MockEntry>) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...patch } as MockEntry : e));
    const { error } = await supabase.from("mock_hub_entries" as any).update(patch).eq("id", id);
    if (error) { toast.error(error.message); load(); }
  };

  const addNew = async () => {
    const payload: any = {
      exam: activeExam, institute: "New Institute", mock_name: "New Mock", official_link: "https://",
      price_inr: 0, is_free: false, free_mocks_count: 0, total_mocks_count: 0,
      difficulty: "moderate", exam_similarity_pct: 80, overall_rating: 8,
      question_quality: 8, sectional_analysis: 8, dashboard_experience: 8, price_value: 8,
      pros: [], cons: [], category_tags: [],
    };
    const { error } = await supabase.from("mock_hub_entries" as any).insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Added — edit fields inline");
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this mock?")) return;
    const { error } = await supabase.from("mock_hub_entries" as any).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="min-h-screen">
      <div className="container py-6 max-w-7xl">
        {/* Exam Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 border-b sticky top-16 bg-background/95 backdrop-blur z-20">
          {EXAMS.map(ex => {
            const count = entries.filter(e => e.exam === ex).length;
            return (
              <button key={ex} onClick={() => setActiveExam(ex)} className={`px-5 py-3 text-sm font-semibold rounded-t-lg whitespace-nowrap transition-all border-b-2 -mb-[2px] ${activeExam === ex ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {ex} <span className="ml-1 text-xs opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Section heading (editable) */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-heading font-bold text-xl">
            <EditableText storageKey={`mockhub_section_${activeExam}`} defaultValue={`All ${activeExam} Mocks`} isAdmin={isAdmin} as="span" />
            <span className="text-muted-foreground font-normal"> ({examEntries.length})</span>
          </h2>
          {isAdmin && (
            <Button size="sm" onClick={addNew} className="gap-1.5 rounded-lg"><Plus className="h-3.5 w-3.5" /> Add {activeExam} Mock</Button>
          )}
        </div>

        {examEntries.length === 0 ? (
          <div className="text-center py-16 border rounded-2xl text-muted-foreground">No {activeExam} mocks yet.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {examEntries.map((m, i) => (
              <FullCard key={m.id} entry={m} index={i} isAdmin={isAdmin} onUpdate={(p) => updateField(m.id, p)} onDelete={() => del(m.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FullCard({ entry, index, isAdmin, onUpdate, onDelete }: { entry: MockEntry; index: number; isAdmin: boolean; onUpdate: (p: Partial<MockEntry>) => void; onDelete: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.04, 0.4) }} className="relative rounded-2xl border bg-card p-5 flex flex-col card-hover">
      {entry.is_sponsored && <Badge className="absolute top-3 right-3 bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px]">Sponsored</Badge>}
      {isAdmin && (
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <Button size="icon" variant="ghost" onClick={onDelete} className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-heading font-bold text-lg shrink-0 relative group">
          {entry.institute_logo_url ? <img src={entry.institute_logo_url} alt={entry.institute} className="h-full w-full rounded-xl object-contain" /> : entry.institute[0]}
          {isAdmin && (
            <InlineEdit value={entry.institute_logo_url ?? ""} onSave={v => onUpdate({ institute_logo_url: v || null })} placeholder="Logo URL" trigger="pencil-overlay" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-heading font-bold text-base leading-tight">
            <InlineEdit value={entry.institute} onSave={v => onUpdate({ institute: v })} isAdmin={isAdmin} display={<>{entry.institute}</>} />
          </div>
          <div className="text-xs text-muted-foreground">
            <InlineEdit value={entry.mock_name} onSave={v => onUpdate({ mock_name: v })} isAdmin={isAdmin} display={<>{entry.mock_name}</>} />
          </div>
        </div>
        <div className="flex items-center gap-1 text-amber-500 font-bold text-sm shrink-0">
          <Star className="h-3.5 w-3.5 fill-current" />
          <InlineEdit value={String(entry.overall_rating)} onSave={v => onUpdate({ overall_rating: +v || 0 })} isAdmin={isAdmin} display={<>{entry.overall_rating}</>} type="number" width="w-14" />
          <span className="text-[10px] text-muted-foreground font-normal">/10</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-[11px]">
        <FieldBox label="Price">
          {isAdmin ? (
            <div className="flex items-center gap-1">
              <span>₹</span>
              <InlineEdit value={String(entry.price_inr)} onSave={v => onUpdate({ price_inr: +v || 0 })} isAdmin display={<>{entry.price_inr}</>} type="number" width="w-16" />
            </div>
          ) : (entry.is_free && entry.price_inr === 0 ? "Free" : `₹${entry.price_inr}`)}
        </FieldBox>
        <FieldBox label="Free mocks">
          {isAdmin ? (
            <div className="flex items-center gap-0.5">
              <InlineEdit value={String(entry.free_mocks_count)} onSave={v => onUpdate({ free_mocks_count: +v || 0 })} isAdmin display={<>{entry.free_mocks_count}</>} type="number" width="w-10" />
              <span>/</span>
              <InlineEdit value={String(entry.total_mocks_count)} onSave={v => onUpdate({ total_mocks_count: +v || 0 })} isAdmin display={<>{entry.total_mocks_count}</>} type="number" width="w-10" />
            </div>
          ) : `${entry.free_mocks_count}/${entry.total_mocks_count}`}
        </FieldBox>
        <FieldBox label="Difficulty">
          {isAdmin ? (
            <Select value={entry.difficulty} onValueChange={v => onUpdate({ difficulty: v })}>
              <SelectTrigger className="h-6 text-[11px] px-1 py-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="actual-cat">Actual Exam Level</SelectItem>
                <SelectItem value="above-cat">Above Exam Level</SelectItem>
              </SelectContent>
            </Select>
          ) : (DIFFICULTY_LABEL[entry.difficulty] ?? entry.difficulty)}
        </FieldBox>
        <FieldBox label="Similarity">
          {isAdmin ? (
            <div className="flex items-center gap-0.5">
              <InlineEdit value={String(entry.exam_similarity_pct)} onSave={v => onUpdate({ exam_similarity_pct: +v || 0 })} isAdmin display={<>{entry.exam_similarity_pct}</>} type="number" width="w-12" />
              <span>%</span>
            </div>
          ) : `${entry.exam_similarity_pct}%`}
        </FieldBox>
      </div>

      <div className="text-xs mb-2">
        <span className="text-muted-foreground">Best for:</span>{" "}
        <span className="font-medium">
          <InlineEdit value={entry.best_for ?? ""} onSave={v => onUpdate({ best_for: v || null })} isAdmin={isAdmin} display={<>{entry.best_for || (isAdmin ? "(add)" : "—")}</>} />
        </span>
      </div>

      <ListEditor label="Pros" items={entry.pros ?? []} onChange={items => onUpdate({ pros: items })} isAdmin={isAdmin} tone="pro" />
      <ListEditor label="Cons" items={entry.cons ?? []} onChange={items => onUpdate({ cons: items })} isAdmin={isAdmin} tone="con" />

      <div className="mt-3 mb-1 text-[11px] text-muted-foreground flex items-center gap-1 min-w-0">
        <ExternalLink className="h-3 w-3 shrink-0" />
        <InlineEdit value={entry.official_link} onSave={v => onUpdate({ official_link: v })} isAdmin={isAdmin} display={<span className="truncate">{entry.official_link}</span>} width="w-full" />
      </div>

      <div className="flex gap-2 mt-3">
        <Button asChild size="sm" className="flex-1 rounded-lg text-xs gap-1"><a href={entry.official_link} target="_blank" rel="noopener noreferrer">Visit <ExternalLink className="h-3 w-3" /></a></Button>
      </div>
    </motion.div>
  );
}

function FieldBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/60 px-2 py-1.5">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-semibold">{children}</div>
    </div>
  );
}

function InlineEdit({
  value, onSave, isAdmin = true, display, type = "text", width, placeholder, trigger,
}: {
  value: string; onSave: (v: string) => void; isAdmin?: boolean; display?: React.ReactNode;
  type?: "text" | "number"; width?: string; placeholder?: string; trigger?: "pencil-overlay";
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);

  if (!isAdmin) return <>{display ?? value}</>;

  if (trigger === "pencil-overlay") {
    return (
      <>
        <button onClick={() => setEditing(true)} className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 rounded-xl flex items-center justify-center transition-opacity">
          <Pencil className="h-3.5 w-3.5 text-white" />
        </button>
        {editing && (
          <div className="absolute z-30 top-full mt-1 left-0 bg-popover border rounded-lg p-2 shadow-lg flex items-center gap-1 w-56">
            <Input value={draft} onChange={e => setDraft(e.target.value)} placeholder={placeholder} className="h-7 text-xs" />
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { onSave(draft); setEditing(false); }}><Check className="h-3 w-3" /></Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setDraft(value); setEditing(false); }}><X className="h-3 w-3" /></Button>
          </div>
        )}
      </>
    );
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <Input
          type={type}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { onSave(draft); setEditing(false); } if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
          autoFocus
          className={`h-6 text-xs px-1 py-0 ${width ?? "w-32"}`}
        />
        <button onClick={() => { onSave(draft); setEditing(false); }} className="text-green-600"><Check className="h-3 w-3" /></button>
        <button onClick={() => { setDraft(value); setEditing(false); }} className="text-muted-foreground"><X className="h-3 w-3" /></button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 group">
      {display ?? value}
      <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary">
        <Pencil className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}

function ListEditor({ label, items, onChange, isAdmin, tone }: { label: string; items: string[]; onChange: (items: string[]) => void; isAdmin: boolean; tone: "pro" | "con" }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const Icon = tone === "pro" ? CheckCircle2 : XCircle;
  const color = tone === "pro" ? "text-green-500" : "text-red-500";

  if (!isAdmin && items.length === 0) return null;

  return (
    <div className="space-y-1 mb-1">
      {isAdmin && <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>}
      {items.map((it, i) => (
        <div key={i} className="flex items-start gap-1.5 text-xs group">
          <Icon className={`h-3 w-3 ${color} mt-0.5 shrink-0`} />
          <span className={`flex-1 ${tone === "con" ? "text-muted-foreground" : ""}`}>
            <InlineEdit value={it} onSave={v => { const next = [...items]; if (v) next[i] = v; else next.splice(i, 1); onChange(next); }} isAdmin={isAdmin} display={<>{it}</>} width="w-full" />
          </span>
          {isAdmin && (
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
      {isAdmin && (
        adding ? (
          <div className="flex items-center gap-1">
            <Input value={draft} onChange={e => setDraft(e.target.value)} autoFocus placeholder={`New ${tone}…`} onKeyDown={e => { if (e.key === "Enter" && draft.trim()) { onChange([...items, draft.trim()]); setDraft(""); setAdding(false); } if (e.key === "Escape") { setAdding(false); setDraft(""); } }} className="h-6 text-xs" />
            <button onClick={() => { if (draft.trim()) { onChange([...items, draft.trim()]); setDraft(""); } setAdding(false); }} className="text-green-600"><Check className="h-3 w-3" /></button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1"><Plus className="h-2.5 w-2.5" /> Add {tone}</button>
        )
      )}
    </div>
  );
}
