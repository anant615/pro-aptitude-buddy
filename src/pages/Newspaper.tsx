import { newsData } from "@/data/news_data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, ExternalLink, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function NewspaperPage() {
  const today = new Date().toISOString().split("T")[0];
  const todayNews = newsData.filter((n) => n.date === today);
  const olderNews = newsData.filter((n) => n.date !== today);

  const renderCard = (n: typeof newsData[0], i: number) => (
    <motion.div
      key={n.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
      className="rounded-xl border bg-card p-6 flex flex-col card-hover"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
          <Newspaper className="h-4 w-4" />
        </div>
        <Badge variant="secondary" className="text-xs">{n.source}</Badge>
      </div>
      <h3 className="font-heading font-semibold mb-1">{n.title}</h3>
      <p className="text-sm text-muted-foreground mb-4 flex-1">{n.description}</p>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" /> {n.date}
        </span>
        <Button size="sm" asChild className="gap-1.5">
          <a href={n.link} target="_blank" rel="noopener noreferrer">
            Read Now <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="container py-10 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-3xl font-bold mb-1">Newspaper & Editorials</h1>
        <p className="text-muted-foreground mb-8">Daily reading material to boost your VARC skills</p>
      </motion.div>

      {todayNews.length > 0 && (
        <>
          <h2 className="font-heading text-lg font-semibold mb-4">Today's Picks</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {todayNews.map(renderCard)}
          </div>
        </>
      )}

      {olderNews.length > 0 && (
        <>
          <h2 className="font-heading text-lg font-semibold mb-4">Previous Days</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {olderNews.map(renderCard)}
          </div>
        </>
      )}
    </div>
  );
}
