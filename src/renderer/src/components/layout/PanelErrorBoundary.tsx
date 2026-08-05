import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "../ui/button";

interface Props {
  /** Changing this resets the boundary — used to retry on navigation. */
  resetKey: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Keeps one broken panel from taking down the whole window.
 *
 * Without this, a single unexpected value in one row — a task priority a
 * backup carried that this build doesn't know, say — throws during render, and
 * React unmounts the entire tree. The user sees a blank window and has to
 * restart the app, with no indication of what happened.
 */
export class PanelErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(previous: Props): void {
    // Navigating away from a broken panel should clear the error, so the rest
    // of the app stays usable without a restart.
    if (this.state.error && previous.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Panel crashed:", error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-64 items-center justify-center py-10">
        <div className="max-w-md rounded-lg border border-destructive/40 bg-destructive/5 p-5 text-center">
          <AlertTriangle className="mx-auto h-6 w-6 text-destructive" />
          <div className="mt-3 font-display text-base">This panel hit an error</div>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            The rest of the app still works — switch to another panel, or try again.
          </p>
          <pre className="scrollbar-thin mt-3 max-h-28 overflow-auto rounded bg-sunken p-2 text-left text-[11px] text-muted-foreground">
            {error.message}
          </pre>
          <Button size="sm" className="mt-3" onClick={() => this.setState({ error: null })}>
            <RotateCcw className="h-3.5 w-3.5" /> Try again
          </Button>
        </div>
      </div>
    );
  }
}
