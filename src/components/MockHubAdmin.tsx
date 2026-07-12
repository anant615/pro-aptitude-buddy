import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";

const EXAMS = ["CAT", "SNAP", "NMAT", "XAT", "CMAT", "MICAT", "TISSNET"];
const DIFFS = ["easy", "moderate", "actual-cat", "above-cat"];
const CATEGORIES = ["most-recommended", "closest-to-exam", "best-free", "best-analytics", "best-overall", "newly-added"];

const empty = {
  exam: "CAT", institute: "", mock_name: "", institute_logo_url: "", official_link: "",
  price_inr: 0, is_free: false, free_mocks_count: 0, total_mocks_count: 0,
  difficulty: "actual-cat", exam_similarity_pct: 85, overall_rating: 8,
  question_quality: 8, sectional_analysis: 8, dashboard_experience: 8, price_value: 8,
  best_for: "", analysis_quality: "", pros: "", cons: "", category_tags: "" as string,
  featured_rank: null as number | null, is_sponsored: false, description: "",
};

export default function MockHubAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>(empty);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("mock_hub_entries" as any).select("*").order("exam").order("featured_rank", { ascending: true, nullsFirst: false });
    setRows((data as any) || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setF(empty); setOpen(true); };
  const openEdit = (r: any) => {
    setEditing(r);
    setF({
      ...r,
      institute_logo_url: r.institute_logo_url ?? "",
      best_for: r.best_for ?? "", analysis_quality: r.analysis_quality ?? "",
      description: r.description ?? "",
      pros: (r.pros || []).join("\n"),
      cons: (r.cons || []).join("\n"),
      category_tags: (r.category_tags || []).join(", "),
    });
    setOpen(true);
  };

  const save = async () => {
    const payload: any = {
      ...f,
      price_inr: +f.price_inr || 0, free_mocks_count: +f.free_mocks_count || 0, total_mocks_count: +f.total_mocks_count || 0,
      exam_similarity_pct: +f.exam_similarity_pct || 0, overall_rating: +f.overall_rating || 0,
      question_quality: +f.question_quality || 0, sectional_analysis: +f.sectional_analysis || 0,
      dashboard_experience: +f.dashboard_experience || 0, price_value: +f.price_value || 0,
      featured_rank: f.featured_rank ? +f.featured_rank : null,
      institute_logo_url: f.institute_logo_url || null,
      best_for: f.best_for || null, analysis_quality: f.analysis_quality || null,
      description: f.description || null,
      pros: (f.pros || "").split("\n").map((s: string) => s.trim()).filter(Boolean),
      cons: (f.cons || "").split("\n").map((s: string) => s.trim()).filter(Boolean),
      category_tags: (f.category_tags || "").split(",").map((s: string) => s.trim()).filter(Boolean),
    };
    if (!payload.institute || !payload.mock_name || !payload.official_link) { toast.error("Institute, mock name & link required"); return; }
    const q = editing
      ? supabase.from("mock_hub_entries" as any).update(payload).eq("id", editing.id)
      : supabase.from("mock_hub_entries" as any).insert(payload);
    const { error } = await q;
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Updated" : "Added"); setOpen(false); load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this mock entry?")) return;
    const { error } = await supabase.from("mock_hub_entries" as any).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted"); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold">Mock Hub Manager</h2>
          <p className="text-sm text-muted-foreground">Add & edit all mock entries shown on /mocks</p>
        </div>
        <Button onClick={openNew} className="gap-2 rounded-lg"><Plus className="h-4 w-4" /> Add Mock</Button>
      </div>

      {loading ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr><th className="text-left px-3 py-2">Exam</th><th className="text-left px-3 py-2">Institute</th><th className="text-left px-3 py-2">Mock</th><th className="text-left px-3 py-2">Price</th><th className="text-left px-3 py-2">Rating</th><th className="text-left px-3 py-2">Featured</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2"><Badge variant="outline">{r.exam}</Badge></td>
                  <td className="px-3 py-2 font-medium">{r.institute}</td>
                  <td className="px-3 py-2 text-muted-foreground truncate max-w-[220px]">{r.mock_name}</td>
                  <td className="px-3 py-2">{r.is_free ? "Free" : `₹${r.price_inr}`}</td>
                  <td className="px-3 py-2">⭐ {r.overall_rating}</td>
                  <td className="px-3 py-2">{r.featured_rank ? `#${r.featured_rank}` : "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(r)} className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => del(r.id)} className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} className="text-center text-muted-foreground py-10">No mocks yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Mock Entry</DialogTitle></DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Exam"><Select value={f.exam} onValueChange={v => setF({ ...f, exam: v })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{EXAMS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Difficulty"><Select value={f.difficulty} onValueChange={v => setF({ ...f, difficulty: v })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{DIFFS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Institute *"><Input value={f.institute} onChange={e => setF({ ...f, institute: e.target.value })} className="h-9" /></Field>
            <Field label="Mock name *"><Input value={f.mock_name} onChange={e => setF({ ...f, mock_name: e.target.value })} className="h-9" /></Field>
            <Field label="Logo URL"><Input value={f.institute_logo_url} onChange={e => setF({ ...f, institute_logo_url: e.target.value })} className="h-9" /></Field>
            <Field label="Official link *"><Input value={f.official_link} onChange={e => setF({ ...f, official_link: e.target.value })} className="h-9" /></Field>
            <Field label="Price (₹)"><Input type="number" value={f.price_inr} onChange={e => setF({ ...f, price_inr: e.target.value })} className="h-9" /></Field>
            <Field label="Free mocks"><Input type="number" value={f.free_mocks_count} onChange={e => setF({ ...f, free_mocks_count: e.target.value })} className="h-9" /></Field>
            <Field label="Total mocks"><Input type="number" value={f.total_mocks_count} onChange={e => setF({ ...f, total_mocks_count: e.target.value })} className="h-9" /></Field>
            <Field label="Exam similarity (%)"><Input type="number" value={f.exam_similarity_pct} onChange={e => setF({ ...f, exam_similarity_pct: e.target.value })} className="h-9" /></Field>
            <Field label="Overall rating (1-10)"><Input type="number" step="0.1" value={f.overall_rating} onChange={e => setF({ ...f, overall_rating: e.target.value })} className="h-9" /></Field>
            <Field label="Question quality (1-10)"><Input type="number" step="0.1" value={f.question_quality} onChange={e => setF({ ...f, question_quality: e.target.value })} className="h-9" /></Field>
            <Field label="Sectional analysis (1-10)"><Input type="number" step="0.1" value={f.sectional_analysis} onChange={e => setF({ ...f, sectional_analysis: e.target.value })} className="h-9" /></Field>
            <Field label="Dashboard experience (1-10)"><Input type="number" step="0.1" value={f.dashboard_experience} onChange={e => setF({ ...f, dashboard_experience: e.target.value })} className="h-9" /></Field>
            <Field label="Price vs value (1-10)"><Input type="number" step="0.1" value={f.price_value} onChange={e => setF({ ...f, price_value: e.target.value })} className="h-9" /></Field>
            <Field label="Featured rank (1-5, blank = none)"><Input type="number" value={f.featured_rank ?? ""} onChange={e => setF({ ...f, featured_rank: e.target.value })} className="h-9" /></Field>
            <Field label="Best for"><Input value={f.best_for} onChange={e => setF({ ...f, best_for: e.target.value })} placeholder="Serious CAT aspirants" className="h-9" /></Field>
            <Field label="Analysis quality"><Input value={f.analysis_quality} onChange={e => setF({ ...f, analysis_quality: e.target.value })} placeholder="Detailed with percentiles" className="h-9" /></Field>
            <Field label="Category tags (comma sep)"><Input value={f.category_tags} onChange={e => setF({ ...f, category_tags: e.target.value })} placeholder={CATEGORIES.join(", ")} className="h-9" /></Field>
            <div className="flex items-center gap-4 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm"><Switch checked={f.is_free} onCheckedChange={v => setF({ ...f, is_free: v })} /> Has free tier</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={f.is_sponsored} onCheckedChange={v => setF({ ...f, is_sponsored: v })} /> Sponsored</label>
            </div>
            <Field label="Pros (one per line)" full><Textarea value={f.pros} onChange={e => setF({ ...f, pros: e.target.value })} className="min-h-[80px]" /></Field>
            <Field label="Cons (one per line)" full><Textarea value={f.cons} onChange={e => setF({ ...f, cons: e.target.value })} className="min-h-[80px]" /></Field>
            <Field label="Description / Who should buy" full><Textarea value={f.description} onChange={e => setF({ ...f, description: e.target.value })} className="min-h-[80px]" /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Add mock"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <div className={full ? "sm:col-span-2" : ""}><Label className="text-xs mb-1 block">{label}</Label>{children}</div>;
}
