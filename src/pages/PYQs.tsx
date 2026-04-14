import { useState } from "react";
import { sampleQuestions, pyqQuestions, pyqLRDISets } from "@/data/questions";
import QuestionCard from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

const allPyqQuestions = [...sampleQuestions.filter(q => q.year), ...pyqQuestions];

// Get unique years and papers
const years = [...new Set(allPyqQuestions.map(q => q.year).filter(Boolean))].sort((a, b) => b! - a!);
const papers = [...new Set(allPyqQuestions.map(q => q.paper).filter(Boolean))];

export default function PYQs() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [category, setCategory] = useState("all");
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
  const [activeLrdiSet, setActiveLrdiSet] = useState<string | null>(null);

  const filteredQuestions = allPyqQuestions.filter((q) => {
    if (selectedYear && q.year !== selectedYear) return false;
    if (category !== "all" && q.category !== category) return false;
    if (selectedPaper && q.paper !== selectedPaper) return false;
    if (category === "lrdi") return false; // LRDI shown as sets
    return true;
  });

  const filteredLrdiSets = pyqLRDISets.filter(s => {
    if (selectedYear && s.year !== selectedYear) return false;
    if (selectedPaper && s.paper !== selectedPaper) return false;
    return true;
  });

  const currentSet = pyqLRDISets.find(s => s.id === activeLrdiSet);

  if (currentSet) {
    return (
      <div className="container py-10">
        <Button variant="ghost" size="sm" onClick={() => setActiveLrdiSet(null)} className="mb-4">← Back to PYQs</Button>
        <h1 className="font-heading text-2xl font-bold mb-2">{currentSet.title}</h1>
        <div className="flex gap-2 mb-6">
          {currentSet.paper && <Badge variant="outline">{currentSet.paper}</Badge>}
          {currentSet.topic && <Badge variant="secondary">{currentSet.topic}</Badge>}
          <Badge variant="secondary">{currentSet.questions.length} Qs</Badge>
        </div>
        <div className="bg-muted rounded-xl p-6 mb-8 whitespace-pre-line text-sm leading-relaxed">
          {currentSet.passage}
        </div>
        <div className="space-y-6">
          {currentSet.questions.map((q, i) => (
            <QuestionCard key={q.id} question={q} index={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="font-heading text-3xl font-bold mb-2">Previous Year Questions</h1>
      <p className="text-muted-foreground mb-8">Practice with actual CAT questions from {years[years.length - 1]} to {years[0]}</p>

      {/* Year filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button variant={selectedYear === null ? "default" : "outline"} size="sm" onClick={() => setSelectedYear(null)}>All Years</Button>
        {years.map((y) => (
          <Button key={y} variant={selectedYear === y ? "default" : "outline"} size="sm" onClick={() => setSelectedYear(y!)}>
            {y}
          </Button>
        ))}
      </div>

      {/* Paper filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button variant={selectedPaper === null ? "default" : "outline"} size="sm" onClick={() => setSelectedPaper(null)}>All Papers</Button>
        {papers.map((p) => (
          <Button key={p} variant={selectedPaper === p ? "default" : "outline"} size="sm" onClick={() => setSelectedPaper(p!)}>
            {p}
          </Button>
        ))}
      </div>

      {/* Section filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {["all", "quant", "lrdi", "verbal"].map((c) => (
          <Button key={c} variant={category === c ? "default" : "outline"} size="sm" onClick={() => setCategory(c)} className="capitalize">
            {c === "all" ? "All Sections" : c === "quant" ? "Quant" : c === "lrdi" ? "LRDI" : "VARC"}
          </Button>
        ))}
      </div>

      {/* LRDI Sets */}
      {(category === "all" || category === "lrdi") && filteredLrdiSets.length > 0 && (
        <div className="mb-10">
          <h2 className="font-heading text-xl font-semibold mb-4">LRDI Sets ({filteredLrdiSets.length})</h2>
          <div className="grid gap-3">
            {filteredLrdiSets.map(set => (
              <button
                key={set.id}
                onClick={() => setActiveLrdiSet(set.id)}
                className="flex items-center justify-between p-5 rounded-xl border bg-card card-hover text-left"
              >
                <div>
                  <h3 className="font-heading font-semibold">{set.title}</h3>
                  <div className="flex gap-2 mt-2">
                    {set.paper && <Badge variant="outline">{set.paper}</Badge>}
                    <Badge variant="secondary">{set.questions.length} questions</Badge>
                    {set.topic && <Badge variant="outline">{set.topic}</Badge>}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Questions */}
      {(category !== "lrdi") && (
        <div>
          {category === "all" && filteredLrdiSets.length > 0 && (
            <h2 className="font-heading text-xl font-semibold mb-4">
              {category === "all" ? "VARC & Quant" : category === "quant" ? "Quantitative Aptitude" : "VARC"} ({filteredQuestions.length})
            </h2>
          )}
          <div className="space-y-6">
            {filteredQuestions.length > 0 ? (
              filteredQuestions.map((q, i) => <QuestionCard key={q.id} question={q} index={i} />)
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <p>No PYQs found for the selected filters.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
