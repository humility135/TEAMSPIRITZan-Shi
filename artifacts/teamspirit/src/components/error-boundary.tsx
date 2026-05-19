import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <Card className="max-w-md w-full p-8 text-center space-y-4 border-destructive/30 bg-card/50 backdrop-blur">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <div>
              <h2 className="text-lg font-bold">Something went wrong</h2>
              <p className="text-sm text-muted-foreground mt-1">
                An unexpected error occurred. Please try refreshing the page.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                this.setState({ error: null });
                window.location.reload();
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
