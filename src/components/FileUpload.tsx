import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function FileUpload({ onUploaded }: { onUploaded: (publicUrl: string) => void }) {
  const [up, setUp] = useState(false);
  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUp(true);
    const path = `${Date.now()}-${f.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("uploads").upload(path, f);
    if (error) { toast.error("Upload failed: " + error.message); setUp(false); return; }
    const { data } = supabase.storage.from("uploads").getPublicUrl(path);
    onUploaded(data.publicUrl);
    toast.success("File uploaded");
    setUp(false);
  };
  return (
    <Button type="button" variant="outline" size="sm" asChild className="gap-1.5 cursor-pointer" disabled={up}>
      <label>
        {up ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {up ? "Uploading..." : "Upload file"}
        <input type="file" className="hidden" onChange={handle} accept="application/pdf,image/*" disabled={up} />
      </label>
    </Button>
  );
}
