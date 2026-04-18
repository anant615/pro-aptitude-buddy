import { usePageViewTracker } from "@/hooks/useTracking";

/** Tracks every route change. Mount once inside <BrowserRouter>. */
export default function PageTracker() {
  usePageViewTracker();
  return null;
}
