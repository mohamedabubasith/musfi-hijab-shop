import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-4 max-w-md p-8">
            <div className="text-5xl">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
            <p className="text-sm text-gray-500 font-mono bg-gray-100 p-3 rounded">{this.state.error?.message}</p>
            <Button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}>
              Reload Page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
