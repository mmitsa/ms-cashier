import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/app/App';
import '@/styles/globals.css';

// ── Error Boundary ──────────────────────────────────────
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('❌ App Error:', error, info);
  }
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
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 8 }}>
              حدث خطأ غير متوقع
            </h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
              {this.state.error?.message || 'خطأ في تحميل التطبيق'}
            </p>
            <pre style={{
              background: '#fef2f2', color: '#991b1b', padding: 12, borderRadius: 8,
              fontSize: 11, textAlign: 'left', direction: 'ltr', overflow: 'auto',
              maxHeight: 120, marginBottom: 16,
            }}>
              {this.state.error?.stack?.split('\n').slice(0, 5).join('\n')}
            </pre>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              style={{
                background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10,
                padding: '10px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              إعادة تحميل الصفحة
            </button>
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
