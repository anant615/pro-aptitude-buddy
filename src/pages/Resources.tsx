import { resourcesData } from "@/data/resources_data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, Wrench, Table, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const typeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-5 w-5" />,
  article: <BookOpen className="h-5 w-5" />,
  tool: <Wrench className="h-5 w-5" />,
  sheet: <Table className="h-5 w-5" />,
};

const typeColors: Record<string, string> = {
  pdf: "bg-destructive/10 text-destructive",
  article: "bg-accent/10 text-accent",
  tool: "bg-green-500/10 text-green-600 dark:text-green-400",
  sheet: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export default function Resources() {
  return (
    <div className="container py-10 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-3xl font-bold mb-1">Resources</h1>
        <p className="text-muted-foreground mb-8">Curated study material, formula sheets, and tools</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {resourcesData.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border bg-card p-6 flex flex-col card-hover"
          >
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-4 ${typeColors[r.type]}`}>
              {typeIcons[r.type]}
            </div>
            <h3 className="font-heading font-semibold mb-1">{r.title}</h3>
            <p className="text-sm text-muted-foreground mb-4 flex-1">{r.description}</p>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs capitalize">{r.type}</Badge>
              <Button size="sm" variant="outline" asChild className="gap-1.5">
                <a href={r.link} target="_blank" rel="noopener noreferrer">
                  Open <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
