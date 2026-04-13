import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/app/App';
import '@/styles/globals.css';

// ── Error Boundary ──────────────────────────────────────
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ errorInfo: info });
    console.error('[ErrorBoundary]', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReport = () => {
    const { error, errorInfo } = this.state;
    const details = [
      `Error: ${error?.message}`,
      `URL: ${window.location.href}`,
      `Time: ${new Date().toISOString()}`,
      `Stack:\n${error?.stack?.split('\n').slice(0, 8).join('\n') ?? 'N/A'}`,
      errorInfo?.componentStack ? `Component Stack:\n${errorInfo.componentStack}` : '',
    ].filter(Boolean).join('\n\n');

    navigator.clipboard.writeText(details).then(() => {
      alert('تم نسخ تفاصيل الخطأ. يمكنك لصقها عند التواصل مع الدعم الفني.');
    }).catch(() => {
      prompt('انسخ تفاصيل الخطأ التالية:', details);
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div dir="rtl" style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#f9fafb', fontFamily: "'IBM Plex Sans Arabic', sans-serif",
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 40, maxWidth: 500,
            boxShadow: '0 4px 24px rgba(0,0,0,.08)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#9888;&#65039;</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 8 }}>
              حدث خطأ غير متوقع
            </h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
              نعتذر عن هذا الخطأ. يمكنك إعادة المحاولة أو الإبلاغ عن المشكلة.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre style={{
                background: '#fef2f2', color: '#991b1b', padding: 12, borderRadius: 8,
                fontSize: 11, textAlign: 'left', direction: 'ltr', overflow: 'auto',
                maxHeight: 120, marginBottom: 16,
              }}>
                {this.state.error.stack?.split('\n').slice(0, 5).join('\n')}
              </pre>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={this.handleRetry}
                style={{
                  background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10,
                  padding: '10px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                إعادة المحاولة
              </button>
              <button
                onClick={this.handleReport}
                style={{
                  background: '#fff', color: '#4f46e5', border: '2px solid #4f46e5', borderRadius: 10,
                  padding: '10px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                الإبلاغ عن المشكلة
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Register Service Worker for PWA / Offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('SW registration failed:', err);
    });
  });
}
