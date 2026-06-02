import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <section className="flex flex-col items-center justify-center min-h-screen bg-bg p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="text-6xl">⚠️</div>
            <h1 className="text-2xl font-bold text-on-surface">Algo salió mal</h1>
            <p className="text-on-surface-variant">
              Ocurrió un error inesperado. No te preocupes, tus datos están seguros.
            </p>
            {this.state.error && (
              <details className="text-left bg-surface-container-high p-4 rounded-xl">
                <summary className="cursor-pointer text-sm font-medium text-on-surface-variant">
                  Detalles técnicos
                </summary>
                <pre className="mt-2 text-xs text-outline overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
