// src/components/ErrorBoundary.jsx
import { Component } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Helmet>
            <title>Error | Azmah College</title>
            <meta name="description" content="An error occurred on the Azmah College website." />
          </Helmet>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <div className="flex justify-center gap-4">
              <button
                className="gradient-btn px-6 py-3 rounded-lg font-semibold text-lg"
                onClick={() => window.location.reload()}
                aria-label="Reload page"
              >
                Reload Page
              </button>
              <Link
                to="/"
                className="gradient-btn px-6 py-3 rounded-lg font-semibold text-lg"
                aria-label="Return to home"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
