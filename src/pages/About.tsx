import { BookOpen, Target, Users, GraduationCap, Briefcase, Youtube } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { EditableText } from "@/components/EditableText";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Pencil } from "lucide-react";

function useEditableLink(key: string, defaultValue: string) {
  const [value, setValue] = useState<string>(() => localStorage.getItem(`home_link_${key}`) || defaultValue);
  useEffect(() => { localStorage.setItem(`home_link_${key}`, value); }, [key, value]);
  return [value, setValue] as const;
}

function EditableLink({ storageKey, defaultValue, isAdmin, children, className }: { storageKey: string; defaultValue: string; isAdmin: boolean; children: React.ReactNode; className?: string }) {
  const [url, setUrl] = useEditableLink(storageKey, defaultValue);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(url);
  if (editing) {
    return (
      <div className="flex items-center gap-1.5 w-full">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} className="h-8 text-xs" />
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setUrl(draft); setEditing(false); }}><Check className="h-3.5 w-3.5" /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setDraft(url); setEditing(false); }}><X className="h-3.5 w-3.5" /></Button>
      </div>
    );
  }
  const isInternal = url.startsWith("/");
  const linkEl = isInternal ? <Link to={url} className={className}>{children}</Link> : <a href={url} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
  return (
    <span className="inline-flex items-center gap-1">
      {linkEl}
      {isAdmin && <button onClick={() => { setDraft(url); setEditing(true); }} className="text-muted-foreground hover:text-accent"><Pencil className="h-3 w-3" /></button>}
    </span>
  );
}

export default function About() {
  const { isAdmin } = useAuth();
  return (
    <div className="container py-10 max-w-3xl">
      <h1 className="font-heading text-3xl font-bold mb-8">
        <EditableText storageKey="about_title" defaultValue="About Pro Aptitude" isAdmin={isAdmin} />
      </h1>

      <div className="prose prose-lg max-w-none">
        <div className="rounded-xl border bg-card p-8 mb-8">
          <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            <EditableText storageKey="about_mission_title" defaultValue="Our Mission" isAdmin={isAdmin} />
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            <EditableText
              storageKey="about_mission"
              defaultValue="Pro Aptitude was built with one purpose — to make quality CAT, OMET, and SNAP preparation accessible to every aspirant in India. No fluff, no overpriced courses. Just consistent daily practice with high-quality questions, detailed solutions, and honest guidance from someone who has walked this path."
              isAdmin={isAdmin}
              multiline
            />
          </p>
        </div>

        <div className="rounded-xl border bg-card p-8 mb-8">
          <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            <EditableText storageKey="about_aman_title" defaultValue="About Aman Pandey" isAdmin={isAdmin} />
          </h2>

          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              <EditableText
                storageKey="about_aman_p1"
                defaultValue="Hi, I'm Aman Pandey — the founder of Pro Aptitude. I completed my MBA from SIBM Bengaluru (Symbiosis Institute of Business Management) as part of the 2024–26 batch, and I'm currently placed at ICICI Bank."
                isAdmin={isAdmin}
                multiline
              />
            </p>

            <p className="flex flex-wrap items-center gap-2">
              <GraduationCap className="h-4 w-4 text-accent inline" />
              <strong className="text-foreground">
                <EditableText storageKey="about_edu" defaultValue="MBA, SIBM Bengaluru (2024–26)" isAdmin={isAdmin} />
              </strong>
              <span>·</span>
              <Briefcase className="h-4 w-4 text-accent inline" />
              <strong className="text-foreground">
                <EditableText storageKey="about_work" defaultValue="ICICI Bank" isAdmin={isAdmin} />
              </strong>
            </p>

            <p>
              <EditableText
                storageKey="about_aman_p2"
                defaultValue="Having cleared CAT, SNAP, and other OMET exams myself, I know exactly how overwhelming the prep journey can feel — too much information, too little structure, and not enough honest mentors. Pro Aptitude is my way of giving back. It's a deep personal hobby of mine to help fellow aspirants crack these exams without burning out or paying lakhs for coaching."
                isAdmin={isAdmin}
                multiline
              />
            </p>

            <p>
              <EditableText
                storageKey="about_aman_p3"
                defaultValue="I'll personally share SNAP-specific tips, sectional strategies, time-management hacks, and B-school insights here. Every question, every solution, every resource on this platform is hand-picked with one goal — your selection."
                isAdmin={isAdmin}
                multiline
              />
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <EditableLink
                storageKey="about_yt"
                defaultValue="https://www.youtube.com/@amanpandey1_"
                isAdmin={isAdmin}
                className="inline-flex items-center gap-2 rounded-md bg-gradient-gold text-accent-foreground font-semibold px-4 py-2 text-sm hover:opacity-90"
              >
                <Youtube className="h-4 w-4" /> Subscribe on YouTube
              </EditableLink>
              <EditableLink
                storageKey="about_linkedin"
                defaultValue="https://www.linkedin.com/in/aman-pandey-iimk/"
                isAdmin={isAdmin}
                className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Connect on LinkedIn
              </EditableLink>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-8">
          <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            <EditableText storageKey="about_offer_title" defaultValue="What We Offer" isAdmin={isAdmin} />
          </h2>
          <ul className="space-y-3 text-muted-foreground">
            {[
              { k: "off1", d: "Topic-wise practice questions across Quant, LRDI, and Verbal Ability" },
              { k: "off2", d: "Full LRDI case-based sets replicating the actual CAT format" },
              { k: "off3", d: "Previous Year Questions from 2015–2024 with detailed solutions" },
              { k: "off4", d: "Sectional mock tests for focused revision" },
              { k: "off5", d: "SNAP-specific tips & strategy from a SIBM Bengaluru alum" },
              { k: "off6", d: "Curated YouTube video library for concept clarity" },
            ].map((o) => (
              <li key={o.k} className="flex items-start gap-2">
                <span className="h-2 w-2 rounded-full bg-accent mt-2 shrink-0" />
                <span><EditableText storageKey={o.k} defaultValue={o.d} isAdmin={isAdmin} multiline /></span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
