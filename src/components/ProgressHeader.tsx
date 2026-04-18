import { Trophy, Flame, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

interface Props {
  title: string;
  completed: number;
  total: number;
  pointsPerItem: number;
  icon?: React.ReactNode;
}

/**
 * Compact gamified header: progress bar + completion stats + leaderboard link.
 * Drop on top of Videos/DPP/PYQs/Resources pages.
 */
export default function ProgressHeader({ title, completed, total, pointsPerItem, icon }: Props) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const earned = completed * pointsPerItem;
  const remaining = Math.max(total - completed, 0);

  return (
    <div className="rounded-xl border bg-gradient-to-br from-accent/10 to-primary/5 p-4 mb-6">
      <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-accent/15 flex items-center justify-center text-accent">
            {icon || <Target className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="font-heading font-semibold text-sm">
              {completed} / {total} done · <span className="text-accent">{earned} pts earned</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {remaining > 0 && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              {remaining * pointsPerItem} pts left
            </span>
          )}
          <Link to="/leaderboard" className="inline-flex items-center gap-1 text-accent hover:underline font-medium">
            <Trophy className="h-3.5 w-3.5" /> Leaderboard
          </Link>
        </div>
      </div>
      <Progress value={pct} className="h-2" />
      <p className="text-[11px] text-muted-foreground mt-1.5">
        {pct === 100 ? "🏆 All done — legend status!" : `${pct}% complete`}
      </p>
    </div>
  );
}
