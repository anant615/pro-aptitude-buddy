import { useEffect, useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function useLocal(key: string, defaultValue: string) {
  const [value, setValue] = useState<string>(() => localStorage.getItem(`edit_${key}`) || defaultValue);
  useEffect(() => { localStorage.setItem(`edit_${key}`, value); }, [key, value]);
  return [value, setValue] as const;
}

interface Props {
  storageKey: string;
  defaultValue: string;
  isAdmin: boolean;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  className?: string;
  multiline?: boolean;
}

export function EditableText({ storageKey, defaultValue, isAdmin, as = "span", className, multiline }: Props) {
  const [value, setValue] = useLocal(storageKey, defaultValue);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <div className="flex items-start gap-1.5 w-full">
        {multiline ? (
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="text-sm min-h-[60px]" />
        ) : (
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} className="h-8 text-sm" />
        )}
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => { setValue(draft); setEditing(false); }}>
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => { setDraft(value); setEditing(false); }}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  const Tag = as as any;
  return (
    <span className="inline-flex items-start gap-1 group">
      <Tag className={className}>{value}</Tag>
      {isAdmin && (
        <button onClick={() => { setDraft(value); setEditing(true); }} className="text-muted-foreground hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity mt-1" title="Edit text">
          <Pencil className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
