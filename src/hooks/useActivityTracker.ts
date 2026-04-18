import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type ActivityType = "video_watched" | "dpp_completed" | "pyq_attempted" | "resource_opened";

const POINTS: Record<ActivityType, number> = {
  video_watched: 3, dpp_completed: 5, pyq_attempted: 4, resource_opened: 2,
};

const LABEL: Record<ActivityType, string> = {
  video_watched: "Video watched", dpp_completed: "DPP completed",
  pyq_attempted: "PYQ attempted", resource_opened: "Resource opened",
};

/**
 * Tracks per-type completion for the current user. Returns the set of completed
 * item ids for the given activity type and a `track(itemId)` to mark one done
 * (idempotent — re-marking is silently ignored). Awards points server-side via trigger.
 */
export function useActivityTracker(type: ActivityType) {
  const { user } = useAuth();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) { setCompleted(new Set()); setLoading(false); return; }
      const { data } = await supabase.from("user_activity")
        .select("item_id").eq("user_id", user.id).eq("activity_type", type);
      if (!alive) return;
      setCompleted(new Set((data || []).map((r: any) => r.item_id)));
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [user, type]);

  const track = useCallback(async (itemId: string) => {
    if (!user) return;
    if (completed.has(itemId)) return;
    const { error } = await supabase.from("user_activity").insert({
      user_id: user.id, activity_type: type, item_id: itemId,
    });
    if (error) {
      // unique violation = already tracked, ignore silently
      if (!error.message.includes("duplicate")) console.warn(error);
      return;
    }
    setCompleted(prev => new Set([...prev, itemId]));
    toast.success(`+${POINTS[type]} points · ${LABEL[type]} 🎉`);
  }, [user, type, completed]);

  return { completed, track, loading };
}
