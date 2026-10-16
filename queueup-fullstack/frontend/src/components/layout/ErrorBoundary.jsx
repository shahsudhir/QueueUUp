import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Send to your error tracker (Sentry, LogRocket…) here.
    console.error("QueueUp crashed:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="grid min-h-dvh place-items-center px-6 text-center">
        <div className="max-w-sm">
          <h1 className="text-2xl font-extrabold text-ink">This page stopped working</h1>
          <p className="mt-2 text-slate-500">
            Reload to try again. Your place in the queue is saved on this device.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 h-12 rounded-xl bg-brand-600 px-6 font-semibold text-white"
          >
            Reload page
          </button>
        </div>
      </main>
    );
  }
}
