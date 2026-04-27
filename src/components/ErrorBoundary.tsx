import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Prevents the entire site from going blank when a single page/component
 * throws. Shows a friendly retry card instead.
 */
export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-16 max-w-lg">
          <div className="rounded-xl border bg-card p-6 text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-orange-500/15 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
            </div>
            <h2 className="font-heading text-xl font-bold mb-1">Something went wrong on this page</h2>
            <p className="text-sm text-muted-foreground mb-4">
              The rest of the site is still working. You can retry, or jump back to the home page.
            </p>
            {this.state.error?.message && (
              <p className="text-xs text-muted-foreground mb-4 font-mono break-all">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-2 justify-center">
              <Button size="sm" onClick={this.reset}>Retry</Button>
              <Button size="sm" variant="outline" onClick={() => (window.location.href = "/")}>Go home</Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
