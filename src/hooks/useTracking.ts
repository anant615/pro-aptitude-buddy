import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Records a page view to public.page_views on every route change.
 * Anonymous-friendly: writes user_id only if logged in.
 */
export function usePageViewTracker() {
  const location = useLocation();
  const last = useRef<string>("");

  useEffect(() => {
    const path = location.pathname + location.search;
    if (path === last.current) return;
    last.current = path;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      let sid = sessionStorage.getItem("sid");
      if (!sid) {
        sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem("sid", sid);
      }
      await supabase.from("page_views").insert({
        path,
        user_id: user?.id ?? null,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent.slice(0, 200),
        session_id: sid,
      });
    })().catch(() => {});
  }, [location.pathname, location.search]);
}

/**
 * Records an outbound link click. Detects YouTube automatically.
 */
export async function trackLinkClick(url: string, sourcePath?: string) {
  try {
    const isYouTube = /youtu\.?be/i.test(url);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("link_clicks").insert({
      url,
      source_path: sourcePath ?? window.location.pathname,
      link_type: isYouTube ? "youtube" : "external",
      user_id: user?.id ?? null,
    });
  } catch {}
}
